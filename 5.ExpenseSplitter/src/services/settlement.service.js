import pool from "../config/db.js";
import AppError from "../utils/AppError.js";
import { getGroupBalances } from "./balance.service.js";

export const simplifyGroupDebts = async (groupId) => {
  const balances = await getGroupBalances(groupId);

  const creditors = [];
  const debtors = [];

  for (const user of balances) {
    if (user.balance > 0.01) {
      creditors.push({
        userId: user.userId,
        name: user.name,
        amount: user.balance,
      });
    }

    if (user.balance < -0.01) {
      debtors.push({
        userId: user.userId,
        name: user.name,
        amount: Math.abs(user.balance),
      });
    }
  }

  const transactions = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const amount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: {
        userId: debtor.userId,
        name: debtor.name,
      },

      to: {
        userId: creditor.userId,
        name: creditor.name,
      },

      amount: Number(amount.toFixed(2)),
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount <= 0.01) {
      creditorIndex++;
    }

    if (debtor.amount <= 0.01) {
      debtorIndex++;
    }
  }

  return transactions;
};

export const createSettlement = async ({
  groupId,
  fromUser,
  toUser,
  amount,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      SELECT pg_advisory_xact_lock(hashtext($1))
      `,
      [`expense-splitter:group:${groupId}`],
    );

    const settlementAmount = Number(amount);

    if (!Number.isFinite(settlementAmount) || settlementAmount <= 0) {
      throw new AppError("Settlement amount must be greater than 0", 400);
    }

    if (fromUser === toUser) {
      throw new AppError("fromUser and toUser must be different", 400);
    }

    // 1. Check group exists and both users belong to it
    const groupResult = await client.query(`SELECT id FROM groups WHERE id = $1`, [
      groupId,
    ]);

    if (groupResult.rowCount === 0) {
      throw new AppError("Group not found", 404);
    }

    const membersResult = await client.query(
      `
        SELECT user_id
        FROM group_members
        WHERE group_id = $1
          AND user_id IN ($2, $3)
      `,
      [groupId, fromUser, toUser],
    );

    if (membersResult.rowCount !== 2) {
      throw new AppError("Both users must be members of the group", 400);
    }

    // 2. Calculate gross debt
    const debtResult = await client.query(
      `
        SELECT
          COALESCE(SUM(
            CASE
              WHEN e.paid_by = $3
                AND es.user_id = $2
              THEN es.amount
              ELSE 0
            END
          ), 0)

          -

          COALESCE(SUM(
            CASE
              WHEN e.paid_by = $2
                AND es.user_id = $3
              THEN es.amount
              ELSE 0
            END
          ), 0)

          AS gross_debt

        FROM expenses e

        INNER JOIN expense_splits es
          ON es.expense_id = e.id

        WHERE e.group_id = $1
      `,
      [groupId, fromUser, toUser],
    );

    const grossDebt = Number(debtResult.rows[0].gross_debt);

    // 3. ADD THE SETTLEMENT QUERY HERE
    const settlementResult = await client.query(
      `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN from_user = $2
                 AND to_user = $3
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS paid_by_from,

          COALESCE(
            SUM(
              CASE
                WHEN from_user = $3
                 AND to_user = $2
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS paid_by_to

        FROM settlements

        WHERE group_id = $1
      `,
      [groupId, fromUser, toUser],
    );

    // 4. Calculate previous payments
    const paidByFrom = Number(settlementResult.rows[0].paid_by_from);

    const paidByTo = Number(settlementResult.rows[0].paid_by_to);

    // 5. Calculate remaining debt
    const outstandingDebt = grossDebt - paidByFrom + paidByTo;

    if (outstandingDebt <= 0.01) {
      throw new AppError("No outstanding debt between these users", 400);
    }

    if (settlementAmount > outstandingDebt) {
      throw new AppError(
        `Settlement cannot exceed outstanding debt of ${outstandingDebt}`,
        400,
      );
    }

    // 6. Create settlement
    const result = await client.query(
      `
        INSERT INTO settlements (
          group_id,
          from_user,
          to_user,
          amount
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          group_id,
          from_user,
          to_user,
          amount,
          created_at
      `,
      [groupId, fromUser, toUser, settlementAmount],
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

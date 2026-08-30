import pool from "../config/db.js";
import AppError from "../utils/AppError.js";
import { splitEqually, toPaise } from "../utils/money.js";

const hasDuplicates = (items) => {
  return new Set(items).size !== items.length;
};

export const createExpense = async ({
  groupId,
  description,
  amount,
  paidBy,
  splitType,
  participants,
  splits,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check group
    const groupResult = await client.query(
      `SELECT id FROM groups WHERE id=$1`,
      [groupId],
    );

    if (groupResult.rowCount === 0) {
      throw new AppError("Group not found", 404);
    }

    // 2. Check payer is a member
    const payerResult = await client.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, paidBy],
    );

    if (payerResult.rowCount === 0) {
      throw new AppError("Payer is not a member of this group", 400);
    }

    // 3. Validate participants/splits
    let participantIds = [];
    let expenseSplits = [];

    if (splitType === "equal") {
      if (!Array.isArray(participants) || participants.length === 0) {
        throw new AppError("At least one participant is required", 400);
      }

      participantIds = participants;

      if (hasDuplicates(participantIds)) {
        throw new AppError("Duplicate participants are not allowed", 400);
      }

      const equalSplits = splitEqually(amount, participantIds.length);

      expenseSplits = participantIds.map((userId, index) => ({
        userId,
        amount: (equalSplits[index].amount / 100).toFixed(2),
      }));
    } else if (splitType === "exact") {
      if (!Array.isArray(splits) || splits.length === 0) {
        throw new AppError("Splits are required for exact split", 400);
      }

      participantIds = splits.map((split) => split.userId);

      if (hasDuplicates(participantIds)) {
        throw new AppError("Duplicate participants are not allowed", 400);
      }

      expenseSplits = splits.map((split) => ({
        userId: split.userId,
        amount: Number(split.amount).toFixed(2),
      }));
    } else {
      throw new AppError("Invalid split type", 400);
    }

    const membersResult = await client.query(
      `
        SELECT user_id
        FROM group_members
        WHERE group_id = $1
        AND user_id = ANY($2::uuid[])
        `,
      [groupId, participantIds],
    );

    if (membersResult.rowCount !== participantIds.length) {
      throw new AppError("All participants must be members of the group", 400);
    }

    // 4. Validate total split amount
    const totalSplitPaise = expenseSplits.reduce(
      (sum, split) => sum + toPaise(split.amount),
      0,
    );

    const totalExpensePaise = toPaise(amount);

    if (totalSplitPaise !== totalExpensePaise) {
      throw new AppError("Split amounts must equal expense amount", 400);
    }

    // 6. Create expense
    const expenseResult = await client.query(
      `
        INSERT INTO expenses (group_id, description, amount, paid_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, group_id, description, amount, paid_by, created_at
        `,
      [groupId, description, amount, paidBy],
    );

    const expense = expenseResult.rows[0];

    // 7. Create splits
    for (const split of expenseSplits) {
      await client.query(
        `
            INSERT INTO expense_splits (expense_id, user_id, amount)
            VALUES ($1,$2,$3)
            `,
        [expense.id, split.userId, split.amount],
      );
    }

    await client.query("COMMIT");

    return {
      ...expense,
      splits: expenseSplits,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getGroupExpenses = async (groupId) => {
  const groupResult = await pool.query(`SELECT id FROM groups WHERE id = $1`, [
    groupId,
  ]);

  if (groupResult.rowCount === 0) {
    throw new AppError("Group not found", 404);
  }

  const result = await pool.query(
    `
      SELECT
        e.id,
        e.description,
        e.amount,
        e.created_at,

        json_build_object(
          'id', payer.id,
          'name', payer.name
        ) AS paid_by,

        COALESCE(
          json_agg(
            json_build_object(
              'userId', split_user.id,
              'name', split_user.name,
              'amount', es.amount
            )
          ) FILTER (WHERE split_user.id IS NOT NULL),
          '[]'
        ) AS splits

      FROM expenses e

      INNER JOIN users payer
        ON payer.id = e.paid_by

      LEFT JOIN expense_splits es
        ON es.expense_id = e.id

      LEFT JOIN users split_user
        ON split_user.id = es.user_id

      WHERE e.group_id = $1

      GROUP BY
        e.id,
        e.description,
        e.amount,
        e.created_at,
        payer.id,
        payer.name

      ORDER BY e.created_at DESC
    `,
    [groupId],
  );

  return result.rows;
};

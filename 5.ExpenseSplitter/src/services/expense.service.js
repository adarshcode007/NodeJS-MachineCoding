import pool from "../config/db.js";
import { splitEqually } from "../utils/money.js";

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
      throw new Error("Group not found");
    }

    // 2. Check payer is a member
    const payerResult = await client.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, paidBy],
    );

    if (payerResult.rowCount === 0) {
      throw new Error("Payer is not a member of this group");
    }

    // 3. Validate participants
    const participantIds = splits.map((split) => split.userId);

    if (!participantIds || participantIds.length === 0) {
      throw new Error("At least one participant is required");
    }

    if (hasDuplicates(participantIds)) {
      throw new Error("Duplicate participants are not allowed");
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
      throw new Error("All participants must be members of the group");
    }

    // 4. Calculate splits
    let expenseSplits;

    if (splitType === "equal") {
      const equalSplits = splitEqually(amount, participantIds.length);

      expenseSplits = participantIds.map((userId, index) => ({
        userId,
        amount: (equalSplits[index].amount / 100).toFixed(2),
      }));
    } else if (splitType === "exact") {
      expenseSplits = splits;
    } else {
      throw new Error("Invalid split type");
    }

    // 5. Validate total split amount
    const totalSplitPaise = expenseSplits.reduce(
      (sum, split) => sum + toPaise(split.amount),
      0,
    );

    const totalExpensePaise = toPaise(amount);

    if (totalSplitPaise !== totalExpensePaise) {
      throw new Error("Split amounts must equal expense amount");
    }

    if (Math.abs(totalSplit - Number(amount)) > 0.01) {
      throw new Error("Split amounts must equal expense amount");
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

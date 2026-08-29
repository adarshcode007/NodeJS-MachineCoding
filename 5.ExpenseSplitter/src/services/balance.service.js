import pool from "../config/db.js";

export const getGroupBalances = async (groupId) => {
  const client = await pool.connect();

  try {
    // Get all group members
    const membersResult = await client.query(
      `
        SELECT
          u.id,
          u.name
        FROM users u
        INNER JOIN group_members gm
          ON gm.user_id = u.id
        WHERE gm.group_id = $1
      `,
      [groupId],
    );

    if (membersResult.rowCount === 0) {
      throw new Error("Group not found or has no members");
    }

    const balances = new Map();

    for (const member of membersResult.rows) {
      balances.set(member.id, {
        userId: member.id,
        name: member.name,
        balance: 0,
      });
    }

    // Get expenses
    const expensesResult = await client.query(
      `
        SELECT
          id,
          paid_by,
          amount
        FROM expenses
        WHERE group_id = $1
      `,
      [groupId],
    );

    for (const expense of expensesResult.rows) {
      const paidAmount = Number(expense.amount);

      balances.get(expense.paid_by).balance += paidAmount;
    }

    // Get what each user owes
    const splitsResult = await client.query(
      `
        SELECT
          es.user_id,
          es.amount
        FROM expense_splits es
        INNER JOIN expenses e
          ON e.id = es.expense_id
        WHERE e.group_id = $1
      `,
      [groupId],
    );

    for (const split of splitsResult.rows) {
      const owedAmount = Number(split.amount);

      balances.get(split.user_id).balance -= owedAmount;
    }

    return Array.from(balances.values());
  } finally {
    client.release();
  }
};

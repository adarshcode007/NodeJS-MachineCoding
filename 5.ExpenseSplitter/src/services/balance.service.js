import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

export const getGroupBalances = async (groupId) => {
  const groupResult = await pool.query(`SELECT id FROM groups WHERE id = $1`, [
    groupId,
  ]);

  if (groupResult.rowCount === 0) {
    throw new AppError("Group not found", 404);
  }

  const result = await pool.query(
    `
      SELECT
        u.id,
        u.name,

        COALESCE(paid.total_paid, 0)
        -
        COALESCE(owed.total_owed, 0)
        +
        COALESCE(sent.total_sent, 0)
        -
        COALESCE(received.total_received, 0)
        AS balance

      FROM users u

      INNER JOIN group_members gm
        ON gm.user_id = u.id

      -- Money paid by the user
      LEFT JOIN (
        SELECT
          e.paid_by AS user_id,
          SUM(e.amount) AS total_paid
        FROM expenses e
        WHERE e.group_id = $1
        GROUP BY e.paid_by
      ) paid
        ON paid.user_id = u.id

      -- Money the user owes
      LEFT JOIN (
        SELECT
          es.user_id,
          SUM(es.amount) AS total_owed
        FROM expense_splits es

        INNER JOIN expenses e
          ON e.id = es.expense_id

        WHERE e.group_id = $1
        GROUP BY es.user_id
      ) owed
        ON owed.user_id = u.id

      -- Settlements received
      LEFT JOIN (
        SELECT
          to_user AS user_id,
          SUM(amount) AS total_received
        FROM settlements
        WHERE group_id = $1
        GROUP BY to_user
      ) received
        ON received.user_id = u.id

      -- Settlements paid
      LEFT JOIN (
        SELECT
          from_user AS user_id,
          SUM(amount) AS total_sent
        FROM settlements
        WHERE group_id = $1
        GROUP BY from_user
      ) sent
        ON sent.user_id = u.id

      WHERE gm.group_id = $1

      ORDER BY u.name
    `,
    [groupId],
  );

  return result.rows.map((user) => ({
    userId: user.id,
    name: user.name,
    balance: Number(user.balance),
  }));
};

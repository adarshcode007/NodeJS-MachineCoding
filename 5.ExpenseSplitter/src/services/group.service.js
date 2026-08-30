import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

export const createGroup = async ({ name }) => {
  const query = `
        INSERT INTO groups (name)
        VALUES ($1)
        RETURNING id, name, created_at
    `;

  const { rows } = await pool.query(query, [name]);

  return rows[0];
};

export const addMemberToGroup = async ({ groupId, userId }) => {
  const groupResult = await pool.query("SELECT id FROM groups WHERE id=$1", [
    groupId,
  ]);

  if (groupResult.rowCount === 0) {
    throw new AppError("Group not found", 404);
  }

  const userResult = await pool.query("SELECT id FROM users WHERE id = $1", [
    userId,
  ]);

  if (userResult.rowCount === 0) {
    throw new AppError("User not found", 404);
  }

  const existingMember = await pool.query(
    `
    SELECT 1
    FROM group_members
    WHERE group_id = $1 AND user_id = $2
    `,
    [groupId, userId],
  );

  if (existingMember.rowCount > 0) {
    throw new AppError("User is already a member of this group", 409);
  }

  const result = await pool.query(
    `
    INSERT INTO group_members (group_id, user_id)
    VALUES ($1, $2)
    RETURNING group_id, user_id, joined_at
    `,
    [groupId, userId],
  );

  return result.rows[0];
};

export const getGroupById = async (groupId) => {
  const result = await pool.query(
    `
      SELECT
        g.id,
        g.name,
        g.created_at,

        COALESCE(
          json_agg(
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS members

      FROM groups g

      LEFT JOIN group_members gm
        ON gm.group_id = g.id

      LEFT JOIN users u
        ON u.id = gm.user_id

      WHERE g.id = $1

      GROUP BY g.id
    `,
    [groupId],
  );

  if (result.rowCount === 0) {
    throw new AppError("Group not found", 404);
  }

  return result.rows[0];
};

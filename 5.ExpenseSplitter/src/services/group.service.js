import pool from "../config/db.js";

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
    throw new Error("Group not found");
  }

  const userResult = await pool.query("SELECT id FROM users WHERE id = $1", [
    userId,
  ]);

  if (userResult.rowCount === 0) {
    throw new Error("User not found");
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
    throw new Error("User is already a member of this group");
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

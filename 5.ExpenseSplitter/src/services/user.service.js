import pool from "../config/db.js";

export const createUser = async ({ name, email }) => {
  const query = `
        INSERT INTO users (name, email)
        VALUES ($1, $2)
        RETURNING id, name, email, created_at
    `;

  const { rows } = await pool.query(query, [name, email]);

  return rows[0];
};

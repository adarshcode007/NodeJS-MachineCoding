import { readFile } from "fs/promises";
import pool from "../config/db.js";

let schemaInitPromise;

const ensureSchema = async () => {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      const schema = await readFile(new URL("../config/schema.sql", import.meta.url), "utf8");
      await pool.query(schema);
    })();
  }

  return schemaInitPromise;
};

export const cleanDatabase = async () => {
  await ensureSchema();
  await pool.query(`
    TRUNCATE
      settlements,
      expense_splits,
      expenses,
      group_members,
      groups,
      users
    RESTART IDENTITY CASCADE
  `);
};

export const createUser = async (name, email) => {
  const { rows } = await pool.query(
    `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING *
    `,
    [name, email],
  );

  return rows[0];
};

export const createGroup = async (name) => {
  const { rows } = await pool.query(
    `
      INSERT INTO groups (name)
      VALUES ($1)
      RETURNING *
    `,
    [name],
  );

  return rows[0];
};

export const addMember = async (groupId, userId) => {
  await pool.query(
    `
      INSERT INTO group_members (group_id, user_id)
      VALUES ($1, $2)
    `,
    [groupId, userId],
  );
};

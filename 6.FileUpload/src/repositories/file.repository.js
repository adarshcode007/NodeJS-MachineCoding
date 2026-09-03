import pool from "../config/database.js";

export async function createFile(file) {
  const query = `
    INSERT INTO files (
      id,
      user_id,
      original_name,
      stored_name,
      mime_type,
      size,
      path
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    file.id,
    file.userId,
    file.originalName,
    file.storedName,
    file.mimeType,
    file.size,
    file.path,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}

export async function findFileById(id) {
  const query = `
    SELECT *
    FROM files
    WHERE id = $1;
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] || null;
}

export async function findFileByIdAndUserId(id, userId) {
  const query = `
    SELECT *
    FROM files
    WHERE id = $1
      AND user_id = $2;
  `;

  const result = await pool.query(query, [id, userId]);

  return result.rows[0] || null;
}

export async function findUserById(id) {
  const query = `
  SELECT id, name
  FROM users
  WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] || null;
}

export async function deleteFileById(id) {
  const query = `
    DELETE FROM files
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0] || null;
}

export async function deleteFilesByIds(ids) {
  if (ids.length === 0) {
    return;
  }

  const query = `
  DELETE FROM files
  WHERE id = ANY($1::uuid[]);
  `;

  await pool.query(query, [ids]);
}

export async function findFiles({ limit, offset }) {
  const query = `
  SELECT *
  FROM files
  ORDER BY created_at DESC
  LIMIT $1
  OFFSET $2;
  `;

  const result = await pool.query(query, [limit, offset]);

  return result.rows;
}

export async function countFiles() {
  const query = `
  SELECT COUNT(*)::int AS count
  FROM files;
  `;

  const result = await pool.query(query);

  return result.rows[0].count;
}

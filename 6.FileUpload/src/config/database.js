import { Pool } from "pg";

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// pool.on("error", (error) => {
//   console.error("Unexpected PostgreSQL error:", error);
// });

const result = await pool.query(`
  SELECT
    current_database(),
    current_user,
    inet_server_addr(),
    inet_server_port()
`);

console.log("DATABASE CONNECTION:", result.rows[0]);

export default pool;

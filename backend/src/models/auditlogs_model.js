import pool from '../config/db.js';

// Create the auditlogs table if it doesn't exist
(async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS auditlogs (
      log_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(50) NOT NULL,
      detail TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✓ auditlogs table is ready');
  } catch (error) {
    console.error('❌ Error creating auditlogs table:', error.message);
  }
})();
// Insert a new audit log
export const insertAuditLog = async (user_id, action, detail) => {
  const result = await pool.query(
    `INSERT INTO auditlogs (user_id, action, detail)    
        VALUES ($1, $2, $3)
        RETURNING log_id, user_id, action, detail, timestamp`,
    [user_id, action, detail]
  );
  return result.rows[0];
};
// Get audit logs for a user
export const getAuditLogsByUser = async (user_id) => {
  const result = await pool.query(
    `SELECT log_id, user_id, action, detail, timestamp 
        FROM auditlogs     
        WHERE user_id = $1 
        ORDER BY timestamp DESC`,
    [user_id]
  );
  return result.rows;
};


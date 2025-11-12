import pool from '../config/db.js';

// Ensure notifications table exists
(async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL, -- e.g., 'budget_warning', 'budget_exceeded'
      category_id INT,           -- category associated with the budget
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('✓ notifications table is ready');
  } catch (error) {
    console.error('❌ Error creating notifications table:', error.message);
  }
})();

export const insertNotification = async (user_id, type, message, category_id = null) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, message, category_id)
     VALUES ($1, $2, $3, $4)
     RETURNING notification_id, user_id, type, message, category_id, is_read, created_at`,
    [user_id, type, message, category_id]
  );
  return result.rows[0];
};

export const getNotificationsByUser = async (user_id) => {
  const result = await pool.query(
    `SELECT n.notification_id, n.user_id, n.type, n.message, n.category_id, n.is_read, n.created_at,
            c.name AS category_name
     FROM notifications n
     LEFT JOIN categories c ON c.category_id = n.category_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC`,
    [user_id]
  );
  return result.rows;
};

export const getUnreadCountByUser = async (user_id) => {
  const result = await pool.query(
    `SELECT COUNT(*)::INT AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [user_id]
  );
  return result.rows[0]?.count || 0;
};

export const markNotificationRead = async (notification_id, user_id) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE
     WHERE notification_id = $1 AND user_id = $2
     RETURNING notification_id, user_id, type, message, category_id, is_read, created_at`,
    [notification_id, user_id]
  );
  return result.rows[0];
};

export const markAllNotificationsRead = async (user_id) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
    [user_id]
  );
  return { success: true };
};

export const deleteNotification = async (notification_id, user_id) => {
  const result = await pool.query(
    `DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id`,
    [notification_id, user_id]
  );
  return result.rows[0];
};

// Utility to avoid duplicate notifications (same type/category per day)
export const hasRecentNotification = async (user_id, type, category_id) => {
  const result = await pool.query(
    `SELECT 1 FROM notifications
     WHERE user_id = $1 AND type = $2 AND (category_id = $3 OR ($3 IS NULL AND category_id IS NULL))
       AND created_at::date = CURRENT_DATE
     LIMIT 1`,
    [user_id, type, category_id]
  );
  return result.rowCount > 0;
};
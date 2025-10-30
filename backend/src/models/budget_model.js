import pool from '../config/db.js';
// Create table automatically if it doesn't exist
(async () => {
  const createTableQuery = `
   CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `;
  try {
    await con.query(createTableQuery);
    console.log('✓ budget table is ready');
  } catch (error) {
    console.error('❌ Error creating budget table:', error.message);
  }
})();
// Add new budget
export const insertBudget = async (user_id, category_id, amount, start_date, end_date) => {
  const result = await pool.query(
    `INSERT INTO budgets (user_id, category_id, amount, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, category_id, amount, start_date, end_date, created_at`,
    [user_id, category_id, amount, start_date, end_date]
  );
  return result.rows[0];
};

// Get budgets for a user
export const getBudgetsByUser = async (user_id) => {
  const result = await pool.query(
    `SELECT b.*, c.name AS category_name, c.type AS category_type
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.user_id = $1`,
    [user_id]
  );
  return result.rows;
};

// Update a budget
export const updateBudgetData = async (budget_id, amount, start_date, end_date) => {
  const result = await pool.query(
    `UPDATE budgets
     SET amount = $1, start_date = $2, end_date = $3
     WHERE id = $4
     RETURNING *`,
    [amount, start_date, end_date, budget_id]
  );
  return result.rows[0];
};

// Delete a budget
export const deleteBudgetData = async (budget_id) => {
  const result = await pool.query(
    `DELETE FROM budgets WHERE id = $1 RETURNING *`,
    [budget_id]
  );
  return result.rows[0];
};

export const getBudgetsWithSummary = async (user_id, month, year) => {
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  const query = `
    SELECT 
      b.id AS budget_id,
      b.amount AS budget_amount,
      c.name AS category_name,
      COALESCE(SUM(t.amount), 0) AS total_spent
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    LEFT JOIN transactions t 
      ON t.category_id = c.id 
      AND t.user_id = $1 
      AND t.date BETWEEN $2 AND $3
    WHERE b.user_id = $1
    GROUP BY b.id, c.name
    ORDER BY c.name;
  `;

  const { rows } = await pool.query(query, [user_id, startDate, endDate]);
  return rows;
};

import con from '../config/db.js';

// Create table automatically if it doesn't exist
(async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS categories (
      category_id SERIAL PRIMARY KEY,
      user_id INT  REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(50) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('Global', 'Personal')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await con.query(createTableQuery);
    console.log('✓ Categories table is ready');
  } catch (error) {
    console.error('❌ Error creating categories table:', error.message);
  }
})();

/* ----------------------
   ✅ Model functions
-----------------------*/

// Insert a new category
export const insertCategory = async (user_id, name, type) => {
  const result = await con.query(
    `INSERT INTO categories (user_id, name, type)
     VALUES ($1, $2, $3)
     RETURNING category_id, user_id, name, type, created_at, updated_at`,
    [user_id, name, type]
  );
  return result.rows[0];
};

// Get all categories for a user
export const getCategoriesByUser = async (user_id) => {
  const result = await con.query(
    `SELECT category_id, name, type 
     FROM categories
     WHERE user_id = $1 or type = 'Global'
     ORDER BY name ASC`,
    [user_id]
  );
  return result.rows;
};

// Update a category
export const updateCategoryData = async (category_id, name, type) => {
  const result = await con.query(
    `UPDATE categories
     SET name = $1, type = $2, updated_at = NOW()
     WHERE category_id = $3
     RETURNING category_id, user_id, name, type, created_at, updated_at`,
    [name, type, category_id]
  );
  return result.rows[0];
};

// Delete a category
export const deleteCategoryData = async (category_id) => {
  const result = await con.query(
    `DELETE FROM categories
     WHERE category_id = $1
     RETURNING category_id, user_id, name, type`,
    [category_id]
  );
  return result.rows[0];
};

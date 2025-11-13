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

// Find category by user and name (case-insensitive)
export const getCategoryByNameForUser = async (user_id, name) => {
  const result = await con.query(
    `SELECT category_id, user_id, name, type
     FROM categories
     WHERE user_id = $1 AND LOWER(name) = LOWER($2)
     LIMIT 1`,
    [user_id, name]
  );
  return result.rows[0] || null;
};

// Find a category visible to user by name (checks user's own and Global)
export const getCategoryByNameVisibleToUser = async (user_id, name) => {
  const result = await con.query(
    `SELECT category_id, user_id, name, type
     FROM categories
     WHERE (user_id = $1 OR type = 'Global') AND LOWER(name) = LOWER($2)
     ORDER BY type = 'Global' DESC
     LIMIT 1`,
    [user_id, name]
  );
  return result.rows[0] || null;
};

// Ensure a category exists for the user, creating it if missing
export const ensureCategoryByName = async (user_id, name, type) => {
  // Prefer existing user-owned category, otherwise reuse a Global one
  const existingUser = await getCategoryByNameForUser(user_id, name);
  if (existingUser) return existingUser;
  const existingVisible = await getCategoryByNameVisibleToUser(user_id, name);
  if (existingVisible) return existingVisible;
  // Default type to 'expense' if invalid
  type = 'Personal';
  return await insertCategory(user_id, name, type);
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

export const getAllCategoriesModel = async () => {
  const result = await con.query(
    `SELECT category_id, user_id, name, type, created_at, updated_at  
      FROM categories
      ORDER BY name ASC`
  );
  return result.rows;
};

// Fetch a single category by ID (used for ownership verification)
export const getCategoryById = async (category_id) => {
  const result = await con.query(
    `SELECT category_id, user_id, name, type
     FROM categories
     WHERE category_id = $1`,
    [category_id]
  );
  return result.rows[0];
};

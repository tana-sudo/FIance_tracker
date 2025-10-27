import pool from '../config/db_config.js';

// Create a new user
export const insertUserData = async (name, email, hashedPassword, role = 'user') => {
    const result = await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, hashedPassword, role]
    );
    return result.rows[0];
};

// Get all users
export const getAllUsers = async () => {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    return result.rows;
};

// Update user info (admin use)
export const updateUser = async (id, name, email, role) => {
    const result = await pool.query(
        `UPDATE users
         SET name = $1, email = $2, role = $3
         WHERE id = $4
         RETURNING id, name, email, role, created_at`,
        [name, email, role, id]
    );
    return result.rows[0];
};

// Delete a user (admin use)
export const deleteUser = async (id) => {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email, role', [id]);
    return result.rows[0];
};
import con from '../config/db.js';

const checkAndCreateTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await con.query(createTableQuery);
        console.log('Users table is ready');
    } catch (error) {
        console.error('Error creating users table:', error.message);
    }
};

// Execute immediately
checkAndCreateTable();

export default { checkAndCreateTable };

export const insertUserData = async (username,fname, email, hashedPassword, role = 'user') => {
    const result = await pool.query(
        `INSERT INTO users (username,name, email, password, role)
         VALUES ($1, $2, $3, $4 ,$5)
         RETURNING id, username ,name, email, role, created_at`,
        [username,fname, email, hashedPassword, role]
    );
    return result.rows[0];
};

// Get all users
export const getAllUsers = async () => {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    return result.rows;
};

export const update_User = async (id,name, email, role) => {
    const result = await pool.query(
        `UPDATE users
         SET name = $1, email = $2
         WHERE id = $3
         RETURNING id, name, email, role, created_at`,
        [name,email,  id]
    );
    return result.rows[0];
};

// Delete a user (admin use)
export const deleteUser = async (id) => {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email, role', [id]);
    return result.rows[0];
};

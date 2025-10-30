import pool from '../config/db.js';
const checkAndCreateTable = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user',
            gender varchar(10) ,
            dob varchar(20) , 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log('Users table is ready');
    } catch (error) {
        console.error('Error creating users table:', error.message);
    }
};

// Execute immediately
checkAndCreateTable();

export default { checkAndCreateTable };

export const insertUserData = async (username,fname, email, hashedPassword, role = 'user', gender , dob) => {
    const result = await pool.query(
        `INSERT INTO users (username,name, email, password, role , gender , dob)
         VALUES ($1, $2, $3, $4 ,$5 , $6 , $7)
         RETURNING id, username ,name, email, role, , gender , dob ,created_at`,
        [username,fname, email, hashedPassword, role , gender , dob]
    );
    return result.rows[0];
};

// Get all users
export const getAllUsers = async () => {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id ASC');
    return result.rows;
};

export const update_User = async (id,name, email, gender , dob) => {
    const result = await pool.query(
        `UPDATE users
         SET name = $1, email = $2 , gender = $3 , dob = $4 
         WHERE id = $5
         RETURNING id, name, email, role, gender , dob,created_at`,
        [name,email,, gender , dob,  id]
    );
    return result.rows[0];
};

// Delete a user (admin use)
export const deleteUser = async (id) => {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email, role, gender , dob', [id]);
    return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const findUserByUsername = async (username) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};
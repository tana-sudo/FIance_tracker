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
      gender VARCHAR(10),
      dob VARCHAR(20),
      status VARCHAR(20) DEFAULT 'active',
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

// execute table creation
checkAndCreateTable();

export default { checkAndCreateTable };

// ✅ Create new user
export const insertUserData = async (username, fname, email, hashedPassword, role = 'user', gender, dob) => {
  const result = await pool.query(
    `INSERT INTO users (username, name, email, password, role, gender, dob)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, username, name, email, role, gender, dob, created_at AS "createdAt"`,
    [username, fname, email, hashedPassword, role, gender, dob]
  );
  return result.rows[0];
};

// ✅ Get all users (with clean field names)
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, username, name, email, role, gender, dob, status, created_at AS "createdAt"
     FROM users
     ORDER BY id ASC`
  );
  return result.rows;
};


// ✅ Update user (fixed syntax and return format)
export const update_User = async (id,username ,fname, email,role ,gender, dob , status) => {
  const result = await pool.query(
    `UPDATE users
     SET username=$1 ,name = $2, email = $3,role = $4 ,gender = $5, dob = $6 , status = $7
     WHERE id = $8
     RETURNING id, username, name, email, role, gender, dob, status, created_at AS "createdAt"`,
    [username ,fname, email,role ,gender, dob,status ,id]
  );
  return result.rows[0];
};

// ✅ Delete user
export const deleteUser = async (id) => {
  const result = await pool.query(
    `DELETE FROM users
     WHERE id = $1
     RETURNING id, username, name, email, role, gender, dob, status`,
    [id]
  );
  return result.rows[0];
};

// ✅ Find users
export const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0];
};

export const findUserByUsername = async (username) => {
  const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
  return result.rows[0];
};

// ✅ Find user by ID (clean field names)
export const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, username, name, email, role, gender, dob, status, created_at AS "createdAt"
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

// ✅ Login
export const loginUserByEmail = async (email, password) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND password = $2`,
    [email, password]
  );
  return result.rows[0];
};

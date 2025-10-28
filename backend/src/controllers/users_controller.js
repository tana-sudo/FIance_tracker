import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
// Create a new user

const insertUserData = async (username,fname, email, hashedPassword, role = 'user') => {
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

const update_User = async (id,name, email, role) => {
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

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, fname, email, password, role } = req.body;
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUser = await insertUserData(username, fname, email, hashedPassword, role);

    // ✅ Return clean JSON
    return res.status(201).json(newUser);
  } catch (error) {
    console.error("❌ Error registering user:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { username, fname, email, role } = req.body;
    
    //update details
    const upUser = await update_User(id,username, fname, email, role);

    // ✅ Return clean JSON
    return res.status(200).json(upUser);
  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const removeUser = async (req, res) => {
  try {
    const id = req.params.id;
    //update details
    const del_User = await deleteUser(id);

    // ✅ Return clean JSON
    return res.status(200).json(del_User);
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};



import pool from '../config/db.js';
import {
  insertUserData,
  update_User,
  deleteUser
} from '../models/user_model.js';
import bcrypt from 'bcryptjs';
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



import pool from '../config/db.js';
import {
  insertUserData,
  update_User,
  deleteUser,
  findUserByEmail,
  findUserByUsername
} from '../models/user_model.js';
import bcrypt from 'bcryptjs';
// Register a new user
export const registerUser = async (req, res) => {
    try {
        const { username, fname, email, password, role, gender, dob } = req.body;

        // Check if email exists
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Check if username exists
        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already in use.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const newUser = await insertUserData(username, fname, email, hashedPassword, role, gender, dob);

        // ✅ Return clean JSON
        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                gender: newUser.gender,
                dob: newUser.dob
            }
        });
    } catch (error) {
        console.error("❌ Error registering user:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { username, fname, email, role, gender , dob  } = req.body;
    
    //update details
    const upUser = await update_User(id,username, fname, email, role , gender , dob);

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



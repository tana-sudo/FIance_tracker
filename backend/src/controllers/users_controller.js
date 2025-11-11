import { logUserAction } from '../middlewares/logHelper.js';
import {
  insertUserData,
  update_User,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  getAllUsers
} from '../models/user_model.js';
import bcrypt from 'bcryptjs';

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, fname, email, password, role, gender, dob } = req.body;

    // ✅ Check existing email
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    // ✅ Check existing username
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already in use.' });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new user into DB
    const newUser = await insertUserData(
      username, 
      fname, 
      email, 
      hashedPassword, 
      role, 
      gender, 
      dob
    );

    // ✅ Log activity (auditable system action)
    await logUserAction(
      req,
      'REGISTER_USER',
      `User ${newUser.id} registered (username: ${username})`
    );

    // ✅ Return clean user data (no password leakage)
    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser.id,
        username: newUser.username,
        fname: newUser.fname, // <-- FIXED field name
        email: newUser.email,
        role: newUser.role,
        gender: newUser.gender,
        dob: newUser.dob
      }
    });

  } catch (error) {
    console.error("❌ Error registering user:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};


export const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();    
    return res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  } 
}

export const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { username, fname, email, role, gender , dob  } = req.body;
    
    await logUserAction(req, 'UPDATE_USER', `User ${id} updated their profile`);
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
    await logUserAction(req, 'DELETE_USER', `User ${id} account deleted`);
    const del_User = await deleteUser(id);

    // ✅ Return clean JSON
    return res.status(200).json(del_User);
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};



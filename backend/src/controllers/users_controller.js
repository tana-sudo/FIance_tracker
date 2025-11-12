import { logUserAction } from '../middlewares/logHelper.js';
import {
  insertUserData,
  update_User,
  deleteUser,
  findUserByEmail,
  findUserByUsername,
  getAllUsers,
  findUserById
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
    const { username, fname, email, role, gender, dob, status } = req.body;
    // Validate required fields
    if (!username || !fname || !email) {
      console.error('Missing required fields');
      return res.status(400).json({ error: "Username, name, and email are required" });
    }
    
    await logUserAction(req, 'UPDATE_USER', `User ${id} updated their profile`);
    
    console.log('Calling update_User...');
    const upUser = await update_User(id, username, fname, email, role, gender, dob, status);
    
    console.log('Update successful:', upUser);
    return res.status(200).json(upUser);
  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    console.error("Full error:", error);
    console.error("Stack:", error.stack);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
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

// ✅ Get current user's profile (requires token)
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    console.error('❌ Error fetching current user:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Update current user's profile (requires token)
export const updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { username, fname, email, role, gender, dob, status } = req.body;
    if (!username || !fname || !email) {
      return res.status(400).json({ error: 'Username, name, and email are required' });
    }

    await logUserAction(req, 'UPDATE_PROFILE', `User ${userId} updated their profile`);
    const updated = await update_User(userId, username, fname, email, role, gender, dob, status);
    return res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Error updating current user:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};



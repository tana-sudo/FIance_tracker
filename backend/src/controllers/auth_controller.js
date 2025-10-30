import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
  findUserByEmail
} from '../models/user_model.js';
import { generateAccessToken, generateRefreshToken } from '../middlewares/auth_middleware.js';
dotenv.config();
// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Find user
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate tokens with consistent payload
        const payload = { id: user.id, email: user.email, role: user.role };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Get Current User (Protected Route)
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id; // From verifyToken middleware

        const query = 'SELECT id, username, name, email, role, created_at FROM users WHERE id = $1';
        const result = await con.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

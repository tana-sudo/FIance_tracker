import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Generate access token (short-lived)
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Verify access token middleware
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // contains { id, email, role }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Refresh token endpoint handler
export const refreshAccessToken = (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // Generate new access token with same payload structure
        const newAccessToken = generateAccessToken({ 
            id: decoded.id, 
            email: decoded.email,
            role: decoded.role
        });

        res.json({ 
            accessToken: newAccessToken,
            userId: decoded.id,
            message: 'Token refreshed successfully'
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Refresh token expired. Please login again' });
        }
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// Optional: Role-based authorization middleware
export const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied. No role found' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions' });
        }

        next();
    };
};
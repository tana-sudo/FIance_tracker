import express from 'express';
import { verifyToken, authorizeRole } from '../middlewares/auth_middleware.js';
import { getMyAuditLogs, getAllAuditLogsController } from '../controllers/auditlogs_controller.js';

const router = express.Router();

// Current user's audit logs
router.get('/user', verifyToken, getMyAuditLogs);

// Admin: all audit logs
router.get('/all', verifyToken, authorizeRole('admin'), getAllAuditLogsController);

// Admin alias route for compatibility
router.get('/getall', verifyToken, authorizeRole('admin'), getAllAuditLogsController);

export default router;
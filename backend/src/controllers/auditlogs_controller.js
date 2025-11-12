import { getAuditLogsByUser, getAllAuditLogs } from '../models/auditlogs_model.js';

export const getMyAuditLogs = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });
    const logs = await getAuditLogsByUser(user_id);
    return res.status(200).json(logs);
  } catch (error) {
    console.error('❌ Error fetching user audit logs:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllAuditLogsController = async (req, res) => {
  try {
    const logs = await getAllAuditLogs(1000);
    return res.status(200).json(logs);
  } catch (error) {
    console.error('❌ Error fetching all audit logs:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
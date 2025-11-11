// utils/logHelper.js
import { insertAuditLog } from "../models/auditlogs_model.js";

export const logUserAction = async (req, action, detail) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      console.warn("⚠️ Skipped audit log: missing user_id");
      return;
    }

    await insertAuditLog(user_id, action, detail);
    console.log(`📝 Logged action: ${action}`);
  } catch (error) {
    console.error("❌ Error logging user action:", error.message);
  }
};

const db = require('../config/database');

async function logAction({
  userId,
  userRole,
  action,
  resourceType,
  resourceId  = null,
  oldValue    = null,
  newValue    = null,
  ipAddress   = null,
  status      = 'SUCCESS'
}) {
  try {
    await db.query(
      `INSERT INTO audit_logs
        (user_id, user_role, action, resource_type, resource_id,
         old_value, new_value, ip_address, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        userId,
        userRole,
        action,
        resourceType,
        resourceId,
        oldValue  ? JSON.stringify(oldValue)  : null,
        newValue  ? JSON.stringify(newValue)  : null,
        ipAddress,
        status,
      ]
    );
  } catch (err) {
    // Eroarea de audit NU opreste fluxul principal
    console.error('[AuditService]', err.message);
  }
}

module.exports = { logAction };

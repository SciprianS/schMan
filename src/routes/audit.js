const router       = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const db           = require('../config/database');

// GET /api/audit — doar Admin, cu filtrare optionala
router.get('/', authenticate, authorize('read', 'AuditLog'), async (req, res) => {
  try {
    const { userId, resourceType, status, from, to } = req.query;

    let query    = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (userId) {
      params.push(userId);
      query += ` AND user_id = $${params.length}`;
    }
    if (resourceType) {
      params.push(resourceType);
      query += ` AND resource_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (from) {
      params.push(from);
      query += ` AND created_at >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND created_at <= $${params.length}`;
    }

    query += ' ORDER BY created_at DESC LIMIT 200';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Eroare interna.' });
  }
});

module.exports = router;

const router       = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const db           = require('../config/database');
const { logAction } = require('../services/auditService');

// GET /api/users — doar Admin
router.get('/', authenticate, authorize('read', 'User'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Eroare interna.' });
  }
});

// GET /api/users/:id — doar Admin
router.get('/:id', authenticate, authorize('read', 'User'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, is_active, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Utilizatorul nu exista.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Eroare interna.' });
  }
});

// DELETE /api/users/:id — soft delete (dezactivare), doar Admin
router.delete('/:id', authenticate, authorize('delete', 'User'), async (req, res) => {
  try {
    const old = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!old.rows.length) {
      return res.status(404).json({ error: 'Utilizatorul nu exista.' });
    }

    await db.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1', [req.params.id]
    );

    await logAction({
      userId: req.user.id, userRole: req.user.role,
      action: 'DELETE', resourceType: 'User',
      resourceId: req.params.id, oldValue: old.rows[0],
      ipAddress: req.ip,
    });

    res.json({ message: 'Cont dezactivat cu succes.' });
  } catch (err) {
    res.status(500).json({ error: 'Eroare interna.' });
  }
});

module.exports = router;

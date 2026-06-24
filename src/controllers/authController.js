const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/database');

// ── INREGISTRARE ─────────────────────────────────────────
async function register(req, res) {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Toate campurile sunt obligatorii.' });
    }

    const rolesPermise = ['admin', 'professor', 'student'];
    if (!rolesPermise.includes(role)) {
      return res.status(400).json({ error: 'Rol invalid.' });
    }

    const existent = await db.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existent.rows.length > 0) {
      return res.status(409).json({ error: 'Email deja inregistrat.' });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, hash, firstName, lastName, role]
    );

    res.status(201).json({ message: 'Cont creat cu succes.', user: result.rows[0] });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

// ── LOGIN ─────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email si parola sunt obligatorii.' });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credentiale invalide.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credentiale invalide.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      message: 'Autentificare reusita.',
      token,
      user: {
        id:        user.id,
        email:     user.email,
        role:      user.role,
        firstName: user.first_name,
        lastName:  user.last_name,
      }
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

// ── PROFIL CURENT ─────────────────────────────────────────
async function me(req, res) {
  try {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

module.exports = { register, login, me };

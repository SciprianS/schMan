// ATENTIE: Acest fisier este folosit EXCLUSIV pentru testele JMeter baseline
// NU il include in productie

const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const db = require('../config/database');

// Fara autorizare orice utilizator autentificat poate face orice

router.get('/', authenticate, async (req, res) => {
  const result = await db.query(
    'SELECT * FROM grades ORDER BY created_at DESC LIMIT 100',
  );
  res.json(result.rows);
});

router.get('/:id', authenticate, async (req, res) => {
  const result = await db.query('SELECT * FROM grades WHERE id = $1', [
    req.params.id,
  ]);
  if (!result.rows.length)
    return res.status(404).json({ error: 'Nota nu exista.' });
  res.json(result.rows[0]); // fara verificare de proprietate
});

router.post('/', authenticate, async (req, res) => {
  const { studentId, courseId, value } = req.body;
  const result = await db.query(
    'INSERT INTO grades (student_id, course_id, professor_id, value) VALUES ($1,$2,$3,$4) RETURNING *',
    [studentId, courseId, req.user.id, value],
  );
  res.status(201).json(result.rows[0]);
});

router.put('/:id', authenticate, async (req, res) => {
  const result = await db.query(
    'UPDATE grades SET value = $1 WHERE id = $2 RETURNING *',
    [req.body.value, req.params.id],
  );
  res.json(result.rows[0]);
});

router.delete('/:id', authenticate, async (req, res) => {
  await db.query('DELETE FROM grades WHERE id = $1', [req.params.id]);
  res.json({ message: 'Sters.' });
});

module.exports = router;

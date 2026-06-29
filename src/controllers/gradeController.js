const { subject } = require('@casl/ability');
const db = require('../config/database');
const { logAction } = require('../services/auditService');

// GET /api/grades — lista filtrata per rol
async function list(req, res) {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      query = 'SELECT * FROM grades ORDER BY created_at DESC LIMIT 100';
      params = [];
    } else if (req.user.role === 'professor') {
      query =
        'SELECT * FROM grades WHERE professor_id = $1 ORDER BY created_at DESC LIMIT 100';
      params = [req.user.id];
    } else {
      query =
        'SELECT * FROM grades WHERE student_id = $1 ORDER BY created_at DESC LIMIT 100';
      params = [req.user.id];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[grades.list]', err.message);
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

// GET /api/grades/:id
async function get(req, res) {
  try {
    const result = await db.query('SELECT * FROM grades WHERE id = $1', [
      req.params.id,
    ]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Nota nu exista.' });
    }

    const grade = result.rows[0];

    // Verificare la nivel de resursa (protectie IDOR)
    const gradeSubject = subject('Grade', {
      studentId: grade.student_id,
      professorId: grade.professor_id,
    });

    if (req.ability.cannot('read', gradeSubject)) {
      await logAction({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'READ',
        resourceType: 'Grade',
        resourceId: req.params.id,
        ipAddress: req.ip,
        status: 'FORBIDDEN',
      });
      return res.status(403).json({ error: 'Nu ai acces la aceasta nota.' });
    }

    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'READ',
      resourceType: 'Grade',
      resourceId: grade.id,
      ipAddress: req.ip,
    });

    res.json(grade);
  } catch (err) {
    console.error('[grades.get]', err.message);
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

// POST /api/grades
async function create(req, res) {
  try {
    const { studentId, courseId, value, description } = req.body;

    if (!studentId || !courseId || !value) {
      return res
        .status(400)
        .json({ error: 'studentId, courseId si value sunt obligatorii.' });
    }

    const result = await db.query(
      `INSERT INTO grades (student_id, course_id, professor_id, value, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [studentId, courseId, req.user.id, value, description || null],
    );

    const newGrade = result.rows[0];

    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CREATE',
      resourceType: 'Grade',
      resourceId: newGrade.id,
      newValue: newGrade,
      ipAddress: req.ip,
    });

    res.status(201).json(newGrade);
  } catch (err) {
    console.error('[grades.create]', err.message);
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

// PUT /api/grades/:id
async function update(req, res) {
  try {
    const { value, description } = req.body;

    const old = await db.query('SELECT * FROM grades WHERE id = $1', [
      req.params.id,
    ]);

    if (!old.rows.length) {
      return res.status(404).json({ error: 'Nota nu exista.' });
    }

    const oldGrade = old.rows[0];

    // Verificare la nivel de resursa
    const gradeSubject = subject('Grade', {
      professorId: oldGrade.professor_id,
    });

    if (req.ability.cannot('update', gradeSubject)) {
      await logAction({
        userId: req.user.id,
        userRole: req.user.role,
        action: 'UPDATE',
        resourceType: 'Grade',
        resourceId: req.params.id,
        ipAddress: req.ip,
        status: 'FORBIDDEN',
      });
      return res.status(403).json({ error: 'Nu poti modifica aceasta nota.' });
    }

    const result = await db.query(
      `UPDATE grades
       SET value       = COALESCE($1, value),
           description = COALESCE($2, description),
           updated_at  = NOW()
       WHERE id = $3 RETURNING *`,
      [value, description, req.params.id],
    );

    const newGrade = result.rows[0];

    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'UPDATE',
      resourceType: 'Grade',
      resourceId: newGrade.id,
      oldValue: oldGrade,
      newValue: newGrade,
      ipAddress: req.ip,
    });

    res.json(newGrade);
  } catch (err) {
    console.error('[grades.update]', err.message);
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

// DELETE /api/grades/:id — doar Admin
async function remove(req, res) {
  try {
    const old = await db.query('SELECT * FROM grades WHERE id = $1', [
      req.params.id,
    ]);

    if (!old.rows.length) {
      return res.status(404).json({ error: 'Nota nu exista.' });
    }

    await db.query('DELETE FROM grades WHERE id = $1', [req.params.id]);

    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'DELETE',
      resourceType: 'Grade',
      resourceId: req.params.id,
      oldValue: old.rows[0],
      ipAddress: req.ip,
    });

    res.json({ message: 'Nota stearsa cu succes.' });
  } catch (err) {
    console.error('[grades.remove]', err.message);
    res.status(500).json({ error: 'Eroare interna.' });
  }
}

module.exports = { list, get, create, update, remove };

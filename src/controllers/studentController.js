const { subject } = require("@casl/ability");
const db = require("../config/database");
const { logAction } = require("../services/auditService");

// GET /api/students
async function list(req, res) {
  try {
    // Studentul nu poate lista toti elevii — doar isi poate vedea propriul profil
    if (req.user.role === "student") {
      return res.status(403).json({ error: "Acces interzis." });
    }

    const result = await db.query(
      `SELECT s.*, u.first_name, u.last_name, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       ORDER BY u.last_name`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[students.list]", err.message);
    res.status(500).json({ error: "Eroare interna." });
  }
}

// GET /api/students/:id
async function get(req, res) {
  try {
    const result = await db.query(
      `SELECT s.*, u.first_name, u.last_name, u.email
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [req.params.id],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Elevul nu exista." });
    }

    const student = result.rows[0];

    // Studentul poate vedea DOAR propriul profil
    const studentSubject = subject("Student", { userId: student.user_id });

    if (req.ability.cannot("read", studentSubject)) {
      await logAction({
        userId: req.user.id,
        userRole: req.user.role,
        action: "READ",
        resourceType: "Student",
        resourceId: req.params.id,
        ipAddress: req.ip,
        status: "FORBIDDEN",
      });
      return res.status(403).json({ error: "Nu ai acces la acest profil." });
    }

    res.json(student);
  } catch (err) {
    console.error("[students.get]", err.message);
    res.status(500).json({ error: "Eroare interna." });
  }
}

// POST /api/students — doar Admin
async function create(req, res) {
  try {
    const { userId, className, year, parentName, parentPhone, birthDate } =
      req.body;

    if (!userId || !className || !year) {
      return res
        .status(400)
        .json({ error: "userId, className si year sunt obligatorii." });
    }

    const result = await db.query(
      `INSERT INTO students (user_id, class_name, year, parent_name, parent_phone, birth_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        userId,
        className,
        year,
        parentName || null,
        parentPhone || null,
        birthDate || null,
      ],
    );

    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: "CREATE",
      resourceType: "Student",
      resourceId: result.rows[0].id,
      newValue: result.rows[0],
      ipAddress: req.ip,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("[students.create]", err.message);
    res.status(500).json({ error: "Eroare interna." });
  }
}

// PUT /api/students/:id — doar Admin
async function update(req, res) {
  try {
    const { className, year, parentName, parentPhone, birthDate } = req.body;

    const old = await db.query(
      `SELECT s.*, u.first_name, u.last_name FROM students s
       JOIN users u ON s.user_id = u.id WHERE s.id = $1`,
      [req.params.id],
    );

    if (!old.rows.length) {
      return res.status(404).json({ error: "Elevul nu exista." });
    }

    const result = await db.query(
      `UPDATE students
       SET class_name   = COALESCE($1, class_name),
           year         = COALESCE($2, year),
           parent_name  = COALESCE($3, parent_name),
           parent_phone = COALESCE($4, parent_phone),
           birth_date   = COALESCE($5, birth_date)
       WHERE id = $6
       RETURNING *`,
      [
        className || null,
        year || null,
        parentName || null,
        parentPhone || null,
        birthDate || null,
        req.params.id,
      ],
    );

    await logAction({
      userId: req.user.id,
      userRole: req.user.role,
      action: "UPDATE",
      resourceType: "Student",
      resourceId: req.params.id,
      oldValue: old.rows[0],
      newValue: result.rows[0],
      ipAddress: req.ip,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[students.update]", err.message);
    res.status(500).json({ error: "Eroare interna." });
  }
}

module.exports = { list, get, create, update };

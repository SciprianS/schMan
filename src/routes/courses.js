const router = require("express").Router();
const authenticate = require("../middleware/authenticate");
const db = require("../config/database");

// Returneaza cursurile proprii (profesor) sau toate (admin)
router.get("/", authenticate, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === "professor") {
      query =
        "SELECT * FROM courses WHERE professor_id = $1 AND is_active = TRUE ORDER BY name";
      params = [req.user.id];
    } else {
      query = "SELECT * FROM courses WHERE is_active = TRUE ORDER BY name";
      params = [];
    }
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("[courses.list]", err.message);
    res.status(500).json({ error: "Eroare interna." });
  }
});

module.exports = router;

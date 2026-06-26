require('dotenv').config();
const express = require('express');
const app = express();

// ── Middleware globale ────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — necesar pentru frontend
try {
  const cors = require('cors');
  app.use(cors());
} catch (_) {
  // cors optional — nu blocheaza testele daca nu e instalat
}

// ── Frontend static (optional) ────────────────────────────
//app.use('/app', express.static('frontend'));

// ── Rute API ──────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/audit', require('./routes/audit'));

// Ruta baseline — decomenteaza DOAR pentru teste JMeter
app.use('/api/baseline/grades', require('./routes/grades.baseline'));

// ── Handler erori globale ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err.stack);
  res.status(500).json({ error: 'Eroare interna a serverului.' });
});

// IMPORTANT: app.listen NU este aici.
// Serverul este pornit din src/server.js (npm run dev).
// Acest fisier exporta doar aplicatia Express pentru Jest.
module.exports = app;

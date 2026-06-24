require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Middleware globale
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Rute securizate
app.use('/app', express.static('frontend'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/audit', require('./routes/audit'));

//  Rute baseline (decomentează DOAR pentru teste JMeter)
//app.use('/api/baseline/grades', require('./routes/grades.baseline'));

// ── Handler erori globale ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err.stack);
  res.status(500).json({ error: 'Eroare interna a serverului.' });
});

module.exports = app;

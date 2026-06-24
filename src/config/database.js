const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max:      20,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 2000,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Eroare conectare PostgreSQL:', err.message);
  } else {
    console.log('Conectat la PostgreSQL cu succes.');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

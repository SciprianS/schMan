const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

// Genereaza tokenii dupa ce seedTestData() a populat global.__TEST_IDS__
function getTokens() {
  const IDS = global.__TEST_IDS__;
  if (!IDS) throw new Error('Apeleaza seedTestData() inainte de getTokens()');

  return {
    admin: generateToken({ id: IDS.admin, email: 'admin@test.ro', role: 'admin' }),
    prof1: generateToken({ id: IDS.prof1, email: 'prof1@test.ro', role: 'professor' }),
    prof2: generateToken({ id: IDS.prof2, email: 'prof2@test.ro', role: 'professor' }),
    stud1: generateToken({ id: IDS.stud1, email: 'stud1@test.ro', role: 'student' }),
    stud2: generateToken({ id: IDS.stud2, email: 'stud2@test.ro', role: 'student' }),
  };
}

module.exports = { generateToken, getTokens };

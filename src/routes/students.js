const router       = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const ctrl         = require('../controllers/studentController');

router.get('/',    authenticate, authorize('read',   'Student'), ctrl.list);
router.get('/:id', authenticate, authorize('read',   'Student'), ctrl.get);
router.post('/',   authenticate, authorize('create', 'Student'), ctrl.create);

module.exports = router;

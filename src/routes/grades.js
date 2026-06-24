const router       = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const ctrl         = require('../controllers/gradeController');

router.get('/',       authenticate, authorize('read',   'Grade'), ctrl.list);
router.get('/:id',    authenticate, authorize('read',   'Grade'), ctrl.get);
router.post('/',      authenticate, authorize('create', 'Grade'), ctrl.create);
router.put('/:id',    authenticate, authorize('update', 'Grade'), ctrl.update);
router.delete('/:id', authenticate, authorize('delete', 'Grade'), ctrl.remove);

module.exports = router;

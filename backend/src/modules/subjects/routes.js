const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');

router.use(auth, tenantScope);

router.post('/', roleGuard('admin'), controller.createSubject);
router.get('/', roleGuard('admin', 'teacher'), controller.listSubjects);
router.delete('/:id', roleGuard('admin'), controller.deleteSubject);
router.post('/:id/assign', roleGuard('admin'), controller.assignTeacher);
router.get('/:id/assignments', roleGuard('admin'), controller.listAssignments);

module.exports = router;
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');

router.use(auth, tenantScope);

router.post('/', roleGuard('admin'), controller.createSubject);
router.get('/', roleGuard('admin', 'teacher', 'super_admin'), controller.listSubjects);
router.delete('/:id', roleGuard('admin'), controller.deleteSubject);
router.post('/:id/assign', roleGuard('admin'), controller.assignTeacher);
router.get('/:id/assignments', roleGuard('admin', 'super_admin'), controller.listAssignments);
router.patch('/:id/assignments/:assignmentId', roleGuard('admin'), controller.updateAssignment);
router.delete('/:id/assignments/:assignmentId', roleGuard('admin'), controller.deleteAssignment);

module.exports = router;
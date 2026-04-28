const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');

router.use(auth, tenantScope);

router.post('/', roleGuard('admin'), controller.createBatch);
router.get('/', roleGuard('admin', 'teacher'), controller.listBatches);
router.get('/:id', roleGuard('admin', 'teacher'), controller.getBatch);
router.put('/:id', roleGuard('admin'), controller.updateBatch);
router.delete('/:id', roleGuard('admin'), controller.deleteBatch);

router.post('/:id/students', roleGuard('admin'), controller.addStudent);
router.delete('/:id/students/:userId', roleGuard('admin'), controller.removeStudent);
router.get('/:id/students', roleGuard('admin', 'teacher'), controller.listStudents);

module.exports = router;
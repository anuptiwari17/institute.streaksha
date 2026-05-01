const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');
const { bulkImport } = require('../../config/rateLimiter');

router.use(auth, tenantScope);

router.post('/teachers', roleGuard('admin'), controller.createTeacher);
router.post('/students', roleGuard('admin'), controller.createStudent);
router.post('/bulk-import', roleGuard('admin'), bulkImport, upload.single('file'), controller.bulkImport);
router.get('/', roleGuard('admin', 'super_admin'), controller.listUsers);
router.get('/:id', roleGuard('admin', 'teacher', 'super_admin'), controller.getUser);
router.patch('/:id', roleGuard('admin'), controller.updateUser);
router.delete('/:id', roleGuard('admin'), controller.deleteUser);

module.exports = router;
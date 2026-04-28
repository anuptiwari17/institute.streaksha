const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');

router.use(auth, tenantScope);

router.get('/', roleGuard('admin', 'teacher'), controller.listQuestions);
router.post('/', roleGuard('admin', 'teacher'), controller.createQuestion);
router.put('/:id', roleGuard('admin', 'teacher'), controller.updateQuestion);
router.delete('/:id', roleGuard('admin', 'teacher'), controller.deleteQuestion);
router.post('/bulk-import', roleGuard('admin', 'teacher'), upload.single('file'), controller.bulkImport);

module.exports = router;
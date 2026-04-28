const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');

router.use(auth, tenantScope);

router.post('/', roleGuard('admin', 'teacher'), controller.createQuiz);
router.get('/', roleGuard('admin', 'teacher', 'student'), controller.listQuizzes);
router.get('/:id', roleGuard('admin', 'teacher', 'student'), controller.getQuiz);
router.put('/:id', roleGuard('admin', 'teacher'), controller.updateQuiz);
router.delete('/:id', roleGuard('admin', 'teacher'), controller.deleteQuiz);

router.post('/:id/questions', roleGuard('admin', 'teacher'), controller.addQuestion);
router.delete('/:id/questions/:qid', roleGuard('admin', 'teacher'), controller.removeQuestion);

router.post('/:id/publish', roleGuard('admin', 'teacher'), controller.publishQuiz);
router.post('/:id/unpublish', roleGuard('admin', 'teacher'), controller.unpublishQuiz);

module.exports = router;
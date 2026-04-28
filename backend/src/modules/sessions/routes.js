const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');
const roleGuard = require('../../middlewares/roleGuard');
const { quizSession } = require('../../config/rateLimiter');

router.use(auth, tenantScope);

router.post('/:quizId/start', roleGuard('student'), controller.startSession);
router.post('/:sessionId/answer', roleGuard('student'), quizSession, controller.saveAnswer);
router.post('/:sessionId/violation', roleGuard('student'), controller.logViolation);
router.post('/:sessionId/submit', roleGuard('student'), controller.submitSession);
router.get('/:sessionId/status', roleGuard('student'), controller.getSessionStatus);

router.get('/quiz/:quizId/results', roleGuard('admin', 'teacher'), controller.getQuizResults);
router.get('/:sessionId/review', roleGuard('admin', 'teacher', 'student'), controller.getSessionReview);

module.exports = router;
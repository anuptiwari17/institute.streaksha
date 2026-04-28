const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const tenantScope = require('../../middlewares/tenantScope');

router.use(auth, tenantScope);

// All roles
router.get('/', controller.getProfile);
router.patch('/', controller.updateProfile);
router.post('/change-password', controller.changePassword);

// Student only
router.get('/my-quizzes', controller.myQuizHistory);

// Teacher only
router.get('/my-subjects', controller.mySubjects);

// Admin only
router.patch('/institution', controller.updateInstitution);

module.exports = router;
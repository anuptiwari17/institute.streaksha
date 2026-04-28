const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../middlewares/auth');
const { login, otp } = require('../../config/rateLimiter');

router.post('/register', otp, controller.register);
router.post('/verify-registration', controller.verifyRegistration);
router.post('/login', login, controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', auth, controller.logout);
router.post('/forgot-password', otp, controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

module.exports = router;
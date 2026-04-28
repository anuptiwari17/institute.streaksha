const service = require('./service');
const { success, error } = require('../../utils/response');

const register = async (req, res) => {
  try {
    const { instituteName, name, email, password } = req.body;
    if (!instituteName || !name || !email || !password)
      return error(res, 'All fields required', 400);
    const data = await service.register({ instituteName, name, email, password });
    return success(res, data, 'OTP sent to email for verification', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const verifyRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return error(res, 'Email and OTP required', 400);
    const data = await service.verifyRegistration({ email, otp });
    return success(res, data, 'Email verified. Welcome to Streaksha!');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password, force } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400);
    const data = await service.login({ email, password, force });
    return success(res, data, 'Login successful');
  } catch (err) {
    if (err.code === 'SESSION_ACTIVE') {
      return res.status(409).json({ success: false, message: err.message, code: err.code });
    }
    return error(res, err.message, err.status || 500);
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required', 400);
    const data = await service.refresh({ refreshToken });
    return success(res, data, 'Token refreshed');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await service.logout({ userId: req.user.id, refreshToken });
    return success(res, {}, 'Logged out');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email required', 400);
    const data = await service.forgotPassword({ email });
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return error(res, 'Email, OTP and new password required', 400);
    const data = await service.resetPassword({ email, otp, newPassword });
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = {
  register,
  verifyRegistration,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
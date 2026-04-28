const pool = require('../../config/db');
const redis = require('../../config/redis');
const bcrypt = require('bcryptjs');
const { signAccess, signRefresh, verifyRefresh } = require('../../utils/jwt');
const { sendOtpEmail } = require('../../utils/email');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const issueTokens = async (user) => {
  const payload = { id: user.id, role: user.role, tenantId: user.tenant_id };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  // Kill any existing session first (clean slate)
  const existingSession = await redis.get(`session:${user.id}`);
  if (existingSession) {
    await redis.setEx(`blacklist:${existingSession}`, 60 * 60 * 24 * 7, '1');
  }

  await redis.setEx(`session:${user.id}`, 60 * 60 * 24 * 7, refreshToken);
  await pool.query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')
     ON CONFLICT DO NOTHING`,
    [user.id, refreshToken]
  );

  return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// Creates tenant + admin user, sends OTP for email verification
// Account is created but not usable until email is verified (future: add is_verified flag if needed)

const register = async ({ instituteName, name, email, password }) => {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw { status: 409, message: 'Email already registered' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tenantResult = await client.query(
      'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
      [instituteName]
    );
    const tenantId = tenantResult.rows[0].id;
    const hash = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [tenantId, name, email, hash]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const otp = generateOtp();
  await redis.setEx(`otp:register:${email}`, 600, otp);
  await sendOtpEmail(email, otp);

  return { message: 'Account created. OTP sent to email for verification.' };
};

// ─── VERIFY REGISTRATION OTP ──────────────────────────────────────────────────
// After register, verify email → issue tokens → user is logged in

const verifyRegistration = async ({ email, otp }) => {
  const stored = await redis.get(`otp:register:${email}`);
  if (!stored || stored !== otp) throw { status: 400, message: 'Invalid or expired OTP' };

  const result = await pool.query(
    'SELECT id, name, email, role, tenant_id FROM users WHERE email = $1',
    [email]
  );
  if (!result.rows.length) throw { status: 404, message: 'User not found' };

  await redis.del(`otp:register:${email}`);
  return issueTokens(result.rows[0]);
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// email + password → check session → if active session exists, return SESSION_ACTIVE
// Frontend shows "Kill session and login?" → user confirms → call login again with force: true

const login = async ({ email, password, force = false }) => {
  const result = await pool.query(
    'SELECT id, name, email, password_hash, role, tenant_id FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );
  if (!result.rows.length) throw { status: 401, message: 'Invalid credentials' };

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Invalid credentials' };

  // Single session enforcement
  const existingSession = await redis.get(`session:${user.id}`);
  if (existingSession && !force) {
    throw { status: 409, message: 'Active session exists on another device.', code: 'SESSION_ACTIVE' };
  }

  return issueTokens(user);
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

const refresh = async ({ refreshToken }) => {
  if (!refreshToken) throw { status: 401, message: 'No refresh token' };

  const blacklisted = await redis.get(`blacklist:${refreshToken}`);
  if (blacklisted) throw { status: 401, message: 'Token revoked' };

  let decoded;
  try {
    decoded = verifyRefresh(refreshToken);
  } catch {
    throw { status: 401, message: 'Invalid refresh token' };
  }

  const stored = await redis.get(`session:${decoded.id}`);
  if (stored !== refreshToken) throw { status: 401, message: 'Session mismatch' };

  const payload = { id: decoded.id, role: decoded.role, tenantId: decoded.tenantId };
  const newAccessToken = signAccess(payload);
  const newRefreshToken = signRefresh(payload);

  await redis.setEx(`blacklist:${refreshToken}`, 60 * 60 * 24 * 7, '1');
  await redis.setEx(`session:${decoded.id}`, 60 * 60 * 24 * 7, newRefreshToken);
  await pool.query(
    `UPDATE sessions SET refresh_token = $1, expires_at = NOW() + INTERVAL '7 days'
     WHERE user_id = $2 AND refresh_token = $3`,
    [newRefreshToken, decoded.id, refreshToken]
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

const logout = async ({ userId, refreshToken }) => {
  await redis.del(`session:${userId}`);
  if (refreshToken) {
    await redis.setEx(`blacklist:${refreshToken}`, 60 * 60 * 24 * 7, '1');
  }
  await pool.query(
    'UPDATE sessions SET is_active = FALSE WHERE user_id = $1',
    [userId]
  );
  return { message: 'Logged out' };
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

const forgotPassword = async ({ email }) => {
  const r = await pool.query(
    'SELECT id FROM users WHERE email = $1 AND is_active = TRUE', [email]
  );
  if (!r.rows.length) throw { status: 404, message: 'No account found with this email' };

  const otp = generateOtp();
  await redis.setEx(`otp:reset:${email}`, 600, otp);
  await sendOtpEmail(email, otp);

  return { message: 'OTP sent to email' };
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

const resetPassword = async ({ email, otp, newPassword }) => {
  const stored = await redis.get(`otp:reset:${email}`);
  if (!stored || stored !== otp) throw { status: 400, message: 'Invalid or expired OTP' };

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
  await redis.del(`otp:reset:${email}`);

  return { message: 'Password updated successfully' };
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
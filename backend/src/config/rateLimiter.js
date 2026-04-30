const rateLimit = require('express-rate-limit');

// ── GENERAL API LIMIT ─────────────────────────────────────────────────────────
// All routes — wide net, blocks abusive clients
const general = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────
// Login attempts — prevent brute force
const login = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// ── OTP REQUESTS ──────────────────────────────────────────────────────────────
// Prevent OTP spam — max 5 per hour per IP
const otp = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Try again in an hour.' },
});

// ── BULK IMPORT ───────────────────────────────────────────────────────────────
// Prevent large import abuse
const bulkImport = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many bulk imports. Try again later.' },
});

// ── QUIZ SESSION ──────────────────────────────────────────────────────────────
// Prevent session spam
const quizSession = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20, // max 20 answer-saves per min (auto-save every few seconds is fine)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests during quiz session.' },
});

module.exports = { general, login, otp, bulkImport, quizSession };
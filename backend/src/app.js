require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { general } = require('./config/rateLimiter');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(general); // global rate limit

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/profile', require('./modules/profile/routes'));
app.use('/api/users', require('./modules/users/routes'));
app.use('/api/batches', require('./modules/batches/routes'));
app.use('/api/subjects', require('./modules/subjects/routes'));
app.use('/api/questions', require('./modules/questions/routes'));
app.use('/api/quizzes', require('./modules/quizzes/routes'));
app.use('/api/sessions', require('./modules/sessions/routes'));
app.use('/api/tenants', require('./modules/tenants/routes'));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
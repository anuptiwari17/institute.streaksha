const service = require('./service');
const { success, error } = require('../../utils/response');

const startSession = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const data = await service.startSession(
      req.tenantId, req.user.id, req.params.quizId, ip
    );
    return success(res, data, 'Session started');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const saveAnswer = async (req, res) => {
  try {
    const data = await service.saveAnswer(
      req.user.id, req.params.sessionId, req.body
    );
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const logViolation = async (req, res) => {
  try {
    const data = await service.logViolation(
      req.user.id, req.params.sessionId, req.body
    );
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const submitSession = async (req, res) => {
  try {
    const data = await service.submitSession(
      req.tenantId, req.user.id, req.params.sessionId
    );
    return success(res, data, 'Quiz submitted');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getSessionStatus = async (req, res) => {
  try {
    const data = await service.getSessionStatus(
      req.user.id, req.params.sessionId
    );
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getQuizResults = async (req, res) => {
  try {
    const data = await service.getQuizResults(
      req.tenantId, req.user.id, req.user.role, req.params.quizId
    );
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getSessionReview = async (req, res) => {
  try {
    const data = await service.getSessionReview(
      req.tenantId, req.user.id, req.user.role, req.params.sessionId
    );
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = {
  startSession, saveAnswer, logViolation,
  submitSession, getSessionStatus,
  getQuizResults, getSessionReview,
};
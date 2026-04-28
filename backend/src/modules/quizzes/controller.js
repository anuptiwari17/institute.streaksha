const service = require('./service');
const { success, error } = require('../../utils/response');

const createQuiz = async (req, res) => {
  try {
    const data = await service.createQuiz(req.tenantId, req.user.id, req.user.role, req.body);
    return success(res, data, 'Quiz created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listQuizzes = async (req, res) => {
  try {
    const data = await service.listQuizzes(req.tenantId, req.user.id, req.user.role, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getQuiz = async (req, res) => {
  try {
    const data = await service.getQuiz(req.tenantId, req.user.id, req.user.role, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const updateQuiz = async (req, res) => {
  try {
    const data = await service.updateQuiz(req.tenantId, req.user.id, req.user.role, req.params.id, req.body);
    return success(res, data, 'Quiz updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const deleteQuiz = async (req, res) => {
  try {
    const data = await service.deleteQuiz(req.tenantId, req.user.id, req.user.role, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const addQuestion = async (req, res) => {
  try {
    const data = await service.addQuestion(req.tenantId, req.user.id, req.user.role, req.params.id, req.body);
    return success(res, data, 'Question added', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const removeQuestion = async (req, res) => {
  try {
    const data = await service.removeQuestion(req.tenantId, req.user.id, req.user.role, req.params.id, req.params.qid);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const publishQuiz = async (req, res) => {
  try {
    const data = await service.publishQuiz(req.tenantId, req.user.id, req.user.role, req.params.id);
    return success(res, data, 'Quiz published');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const unpublishQuiz = async (req, res) => {
  try {
    const data = await service.unpublishQuiz(req.tenantId, req.user.id, req.user.role, req.params.id);
    return success(res, data, 'Quiz unpublished');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = {
  createQuiz, listQuizzes, getQuiz, updateQuiz, deleteQuiz,
  addQuestion, removeQuestion, publishQuiz, unpublishQuiz,
};
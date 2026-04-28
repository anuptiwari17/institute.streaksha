const service = require('./service');
const { success, error } = require('../../utils/response');

const createQuestion = async (req, res) => {
  try {
    const data = await service.createQuestion(
      req.tenantId, req.user.id, req.user.role, req.body
    );
    return success(res, data, 'Question created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listQuestions = async (req, res) => {
  try {
    const data = await service.listQuestions(
      req.tenantId, req.user.id, req.user.role, req.query
    );
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const updateQuestion = async (req, res) => {
  try {
    const data = await service.updateQuestion(
      req.tenantId, req.user.id, req.user.role, req.params.id, req.body
    );
    return success(res, data, 'Question updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const deleteQuestion = async (req, res) => {
  try {
    const data = await service.deleteQuestion(
      req.tenantId, req.user.id, req.user.role, req.params.id
    );
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const bulkImport = async (req, res) => {
  try {
    if (!req.file) return error(res, 'CSV file required', 400);
    const data = await service.bulkImport(
      req.tenantId, req.user.id, req.user.role, req.file.buffer
    );
    return success(res, data, 'Bulk import complete');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = { createQuestion, listQuestions, updateQuestion, deleteQuestion, bulkImport };
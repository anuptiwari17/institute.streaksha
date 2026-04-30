const service = require('./service');
const { success, error } = require('../../utils/response');

const createBatch = async (req, res) => {
  try {
    const data = await service.createBatch(req.tenantId, req.body);
    return success(res, data, 'Batch created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listBatches = async (req, res) => {
  try {
    const data = await service.listBatches(req.tenantId);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getBatch = async (req, res) => {
  try {
    const data = await service.getBatch(req.tenantId, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const updateBatch = async (req, res) => {
  try {
    const data = await service.updateBatch(req.tenantId, req.params.id, req.body);
    return success(res, data, 'Batch updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const deleteBatch = async (req, res) => {
  try {
    const data = await service.deleteBatch(req.tenantId, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const addStudent = async (req, res) => {
  try {
    const data = await service.addStudent(req.tenantId, req.params.id, req.body);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const removeStudent = async (req, res) => {
  try {
    const data = await service.removeStudent(req.tenantId, req.params.id, req.params.userId);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listStudents = async (req, res) => {
  try {
    const data = await service.listStudents(req.tenantId, req.params.id, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listAssignments = async (req, res) => {
  try {
    const data = await service.listAssignments(req.tenantId, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = {
  createBatch, listBatches, getBatch, updateBatch, deleteBatch,
  addStudent, removeStudent, listStudents, listAssignments,
};
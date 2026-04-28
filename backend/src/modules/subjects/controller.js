const service = require('./service');
const { success, error } = require('../../utils/response');

const createSubject = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return error(res, 'Subject name required', 400);
    const data = await service.createSubject(req.tenantId, { name, code });
    return success(res, data, 'Subject created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listSubjects = async (req, res) => {
  try {
    const data = await service.listSubjects(req.tenantId);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const deleteSubject = async (req, res) => {
  try {
    const data = await service.deleteSubject(req.tenantId, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const assignTeacher = async (req, res) => {
  try {
    const { teacherId, batchId } = req.body;
    if (!teacherId || !batchId) return error(res, 'teacherId and batchId required', 400);
    const data = await service.assignTeacher(req.tenantId, req.params.id, { teacherId, batchId });
    return success(res, data, 'Teacher assigned');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listAssignments = async (req, res) => {
  try {
    const data = await service.listAssignments(req.tenantId, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = { createSubject, listSubjects, deleteSubject, assignTeacher, listAssignments };
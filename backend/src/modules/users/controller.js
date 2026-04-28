const service = require('./service');
const { success, error } = require('../../utils/response');

const createTeacher = async (req, res) => {
  try {
    const data = await service.createTeacher(req.tenantId, req.body);
    return success(res, data, 'Teacher created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const createStudent = async (req, res) => {
  try {
    const data = await service.createStudent(req.tenantId, req.body);
    return success(res, data, 'Student created', 201);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const bulkImport = async (req, res) => {
  try {
    if (!req.file) return error(res, 'CSV file required', 400);
    const role = req.query.role === 'teacher' ? 'teacher' : 'student';
    const data = await service.bulkImport(req.tenantId, req.file.buffer, role);
    return success(res, data, 'Bulk import complete');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const listUsers = async (req, res) => {
  try {
    const data = await service.listUsers(req.tenantId, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getUser = async (req, res) => {
  try {
    const data = await service.getUser(req.tenantId, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const updateUser = async (req, res) => {
  try {
    const data = await service.updateUser(req.tenantId, req.params.id, req.body);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const deleteUser = async (req, res) => {
  try {
    const data = await service.deleteUser(req.tenantId, req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = { createTeacher, createStudent, bulkImport, listUsers, getUser, updateUser, deleteUser };
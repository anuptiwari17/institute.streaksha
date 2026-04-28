const service = require('./service');
const { success, error } = require('../../utils/response');

const getProfile = async (req, res) => {
  try {
    const data = await service.getProfile(req.user.id, req.tenantId, req.user.role);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const updateProfile = async (req, res) => {
  try {
    const data = await service.updateProfile(req.user.id, req.user.role, req.body);
    return success(res, data, 'Profile updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const changePassword = async (req, res) => {
  try {
    const data = await service.changePassword(req.user.id, req.body);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const myQuizHistory = async (req, res) => {
  try {
    if (req.user.role !== 'student')
      return error(res, 'Only students can access quiz history', 403);
    const data = await service.myQuizHistory(req.user.id, req.tenantId, req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const mySubjects = async (req, res) => {
  try {
    if (req.user.role !== 'teacher')
      return error(res, 'Only teachers can access assigned subjects', 403);
    const data = await service.mySubjects(req.user.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const updateInstitution = async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return error(res, 'Only admins can update institution details', 403);
    const data = await service.updateInstitution(req.tenantId, req.body);
    return success(res, data, 'Institution updated');
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = {
  getProfile, updateProfile, changePassword,
  myQuizHistory, mySubjects, updateInstitution,
};
const service = require('./service');
const { success, error } = require('../../utils/response');

const listTenants = async (req, res) => {
  try {
    const data = await service.listTenants(req.query);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getTenant = async (req, res) => {
  try {
    const data = await service.getTenant(req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const deactivateTenant = async (req, res) => {
  try {
    const data = await service.deactivateTenant(req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const activateTenant = async (req, res) => {
  try {
    const data = await service.activateTenant(req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

const getTenantStats = async (req, res) => {
  try {
    const data = await service.getTenantStats(req.params.id);
    return success(res, data);
  } catch (err) { return error(res, err.message, err.status || 500); }
};

module.exports = { listTenants, getTenant, deactivateTenant, activateTenant, getTenantStats };
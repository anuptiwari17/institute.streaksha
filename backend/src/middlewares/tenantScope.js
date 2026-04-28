const { error } = require('../utils/response');

// Attaches tenantId from JWT to every request.
// Super admins have no tenantId — they bypass tenant checks at service level.
module.exports = (req, res, next) => {
  if (!req.user) {
    return error(res, 'Unauthorized', 401);
  }

  req.tenantId = req.user.tenantId || null;
  next();
};
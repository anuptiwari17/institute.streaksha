const { error } = require('../utils/response');

// Attaches tenantId from JWT to every request.
// Super admins can pass a tenantId in query/body to access specific tenant data.
module.exports = (req, res, next) => {
  if (!req.user) {
    return error(res, 'Unauthorized', 401);
  }

  // For super_admin, allow tenantId parameter from query or params
  if (req.user.role === 'super_admin') {
    req.tenantId = req.query.tenantId || req.params.tenantId || null;
  } else {
    req.tenantId = req.user.tenantId || null;
  }
  
  next();
};
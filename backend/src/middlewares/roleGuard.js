const { error } = require('../utils/response');

// Usage: roleGuard('admin', 'teacher')
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient role', 403);
    }
    next();
  };
};

module.exports = roleGuard;
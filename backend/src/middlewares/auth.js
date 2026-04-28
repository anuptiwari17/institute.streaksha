const { verifyAccess } = require('../utils/jwt');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccess(token);
    req.user = decoded; // { id, role, tenantId }
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};
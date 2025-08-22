const jwt = require('jsonwebtoken');

// Middleware factory to check for allowed roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }

      // decoded contains email, role, etc.
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions' });
      }

      req.user = decoded;
      next();
    });
  };
};

module.exports = { 
    AdminAuth: authorizeRoles('Admin'),
    SuperAdminAuth: authorizeRoles('superAdmin'),
    authorizeRoles
};
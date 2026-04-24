import pool from '../config/database.js';

// Check if user has required role
export const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await pool.query(
        `SELECT r.name, r.permissions FROM roles r
         INNER JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );

      const userRoles = result.rows.map(r => r.name);
      const hasRole = roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          error: 'Access denied',
          message: `Required role: ${roles.join(' or ')}`
        });
      }

      req.userRoles = userRoles;
      req.userPermissions = result.rows.flatMap(r => r.permissions || []);
      next();
    } catch (error) {
      console.error('RBAC error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Check if user has specific permission
export const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await pool.query(
        `SELECT r.permissions FROM roles r
         INNER JOIN user_roles ur ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [req.user.id]
      );

      const userPermissions = result.rows.flatMap(r => r.permissions || []);
      const hasPermission = permissions.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Access denied',
          message: `Required permission: ${permissions.join(' or ')}`
        });
      }

      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

export default { requireRole, requirePermission };

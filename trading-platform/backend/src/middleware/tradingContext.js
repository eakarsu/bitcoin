import pool from '../config/database.js';

export async function loadTradingContext(req, res, next) {
  const tenantKey = req.get('x-tenant-id');
  if (!tenantKey) return res.status(400).json({ error: 'x-tenant-id is required' });
  try {
    const result = await pool.query(
      `SELECT t.id, t.tenant_key, t.name, m.role
         FROM gt_tenants t
         JOIN gt_memberships m ON m.tenant_id = t.id
        WHERE t.tenant_key = $1 AND m.user_id = $2`,
      [tenantKey, req.user.id]
    );
    if (result.rowCount !== 1) return res.status(403).json({ error: 'tenant membership required' });
    req.tradingTenant = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function requireTradingRole(...roles) {
  return (req, res, next) => {
    if (!req.tradingTenant || !roles.includes(req.tradingTenant.role)) {
      return res.status(403).json({ error: `required trading role: ${roles.join(' or ')}` });
    }
    next();
  };
}

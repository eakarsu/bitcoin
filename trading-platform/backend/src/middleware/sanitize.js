// Input sanitization middleware

// Strip HTML tags
const stripHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
};

// Trim whitespace
const trimValue = (val) => {
  if (typeof val === 'string') return val.trim();
  return val;
};

// Sanitize a single value
const sanitizeValue = (val) => {
  if (typeof val === 'string') {
    val = val.trim();
    val = stripHtml(val);
    // Remove null bytes
    val = val.replace(/\0/g, '');
    // Limit length to prevent abuse
    if (val.length > 10000) val = val.substring(0, 10000);
  }
  return val;
};

// Deep sanitize object
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeValue(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key too (prevent prototype pollution)
    const cleanKey = key.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (cleanKey === '__proto__' || cleanKey === 'constructor' || cleanKey === 'prototype') continue;
    cleaned[cleanKey] = sanitizeObject(value);
  }
  return cleaned;
};

// Middleware to sanitize request body, query, and params
export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeValue(value);
      }
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        req.params[key] = trimValue(value);
      }
    }
  }
  next();
};

// Middleware to validate content type
export const requireJson = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'DELETE' && req.method !== 'HEAD') {
    if (!req.is('application/json') && req.body && Object.keys(req.body).length > 0) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
  }
  next();
};

export default { sanitizeInput, requireJson };

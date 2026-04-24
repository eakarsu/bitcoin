// Password strength validation
export const passwordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  let strength = 'weak';
  if (passed >= 4) strength = 'strong';
  else if (passed >= 3) strength = 'medium';

  return { checks, strength, score: passed, isValid: passed >= 3 };
};

// Validate password middleware
export const validatePassword = (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const result = passwordStrength(password);
  if (!result.isValid) {
    return res.status(400).json({
      error: 'Password too weak',
      details: result.checks,
      message: 'Password must have at least 8 characters, uppercase, lowercase, and a number'
    });
  }

  next();
};

// Validate email format
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

// Validate required fields
export const validateFields = (...fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field] && req.body[field] !== 0);
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missing
      });
    }
    next();
  };
};

// Validate numeric ID param
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: `Invalid ${paramName}` });
    }
    next();
  };
};

export default { validatePassword, validateEmail, validateFields, validateId, passwordStrength };

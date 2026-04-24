import { Box, Typography, LinearProgress } from '@mui/material';
import { Check, Close } from '@mui/icons-material';

const checkPassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let strength = 'Weak';
  let color = 'error';
  if (passed >= 5) { strength = 'Very Strong'; color = 'success'; }
  else if (passed >= 4) { strength = 'Strong'; color = 'success'; }
  else if (passed >= 3) { strength = 'Medium'; color = 'warning'; }

  return { checks, passed, strength, color, percentage: (passed / 5) * 100 };
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const { checks, strength, color, percentage } = checkPassword(password);

  const requirements = [
    { key: 'length', label: 'At least 8 characters' },
    { key: 'uppercase', label: 'Uppercase letter' },
    { key: 'lowercase', label: 'Lowercase letter' },
    { key: 'number', label: 'Number' },
    { key: 'special', label: 'Special character' },
  ];

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={color}
          sx={{ flex: 1, height: 6, borderRadius: 3 }}
        />
        <Typography variant="caption" color={`${color}.main`} fontWeight="bold" sx={{ minWidth: 80 }}>
          {strength}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {requirements.map(({ key, label }) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mr: 1 }}>
            {checks[key] ? (
              <Check sx={{ fontSize: 14, color: 'success.main' }} />
            ) : (
              <Close sx={{ fontSize: 14, color: 'text.disabled' }} />
            )}
            <Typography variant="caption" color={checks[key] ? 'success.main' : 'text.disabled'}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PasswordStrength;

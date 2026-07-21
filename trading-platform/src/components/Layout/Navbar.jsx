import { useState } from 'react';
import {
  AppBar, Box, Toolbar, IconButton, Typography, Menu, Container,
  Button, MenuItem, Tooltip, Avatar, Divider, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, TrendingUp, ShowChart, SmartToy,
  Person, Settings, Logout, Login, SignalCellularAlt, AccountTree,
  SwapHoriz, People, ManageAccounts
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElManage, setAnchorElManage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const toast = useToast();

  const demoEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_LEGACY_DEMO_SURFACES === 'true';
  const pages = [
    { name: 'Paper Trading', path: '/paper-trading', icon: <ShowChart /> },
    ...(demoEnabled ? [
    { name: 'AlgoTrader Pro', path: '/algotrader', icon: <Dashboard /> },
    { name: 'SignalStream', path: '/signalstream', icon: <TrendingUp /> },
    { name: 'AI Analytics', path: '/ai-analytics', icon: <SmartToy /> },
    { name: 'Pricing', path: '/pricing', icon: <ShowChart /> }
    ] : [])
  ];

  const managePages = demoEnabled ? [
    { name: 'Signals', path: '/manage/signals', icon: <SignalCellularAlt /> },
    { name: 'Strategies', path: '/manage/strategies', icon: <AccountTree /> },
    { name: 'Trades', path: '/manage/trades', icon: <SwapHoriz /> },
    { name: 'Users', path: '/manage/users', icon: <People /> },
  ] : [];

  const handleNavigate = (path) => {
    navigate(path);
    setAnchorElNav(null);
    setAnchorElManage(null);
  };

  const handleLogout = async () => {
    setAnchorElUser(null);
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const isActive = (path) => location.pathname === path;
  const isManageActive = managePages.some(p => location.pathname === p.path);

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <AppBar position="sticky" elevation={1} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo - Desktop */}
          <ShowChart sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: 'primary.main' }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            onClick={() => navigate('/')}
            sx={{
              mr: 4, display: { xs: 'none', md: 'flex' }, fontWeight: 700,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}
          >
            TradingPlatform
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton size="large" onClick={(e) => setAnchorElNav(e.currentTarget)} color="inherit">
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)}
              onClose={() => setAnchorElNav(null)}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={() => handleNavigate(page.path)}>
                  <ListItemIcon>{page.icon}</ListItemIcon>
                  <ListItemText>{page.name}</ListItemText>
                </MenuItem>
              ))}
              <Divider />
              <MenuItem disabled><Typography variant="caption" color="text.secondary">Management</Typography></MenuItem>
              {managePages.map((page) => (
                <MenuItem key={page.name} onClick={() => handleNavigate(page.path)}>
                  <ListItemIcon>{page.icon}</ListItemIcon>
                  <ListItemText>{page.name}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Logo - Mobile */}
          <ShowChart sx={{ display: { xs: 'flex', md: 'none' }, mr: 1, color: 'primary.main' }} />
          <Typography
            variant="h6" noWrap component="div"
            onClick={() => navigate('/')}
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' }, flexGrow: 1, fontWeight: 700, color: 'primary.main', cursor: 'pointer' }}
          >
            TradingPlatform
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={() => handleNavigate(page.path)}
                startIcon={page.icon}
                sx={{
                  color: isActive(page.path) ? 'primary.main' : 'text.primary',
                  fontWeight: isActive(page.path) ? 'bold' : 'normal',
                  backgroundColor: isActive(page.path) ? 'action.selected' : 'transparent',
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                {page.name}
              </Button>
            ))}
            {/* Manage Dropdown */}
            {demoEnabled && <Button
              startIcon={<ManageAccounts />}
              onClick={(e) => setAnchorElManage(e.currentTarget)}
              sx={{
                color: isManageActive ? 'primary.main' : 'text.primary',
                fontWeight: isManageActive ? 'bold' : 'normal',
                backgroundColor: isManageActive ? 'action.selected' : 'transparent',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              Manage
            </Button>}
            {demoEnabled && <Menu
              anchorEl={anchorElManage}
              open={Boolean(anchorElManage)}
              onClose={() => setAnchorElManage(null)}
              sx={{ mt: 1 }}
            >
              {managePages.map((page) => (
                <MenuItem key={page.name} onClick={() => handleNavigate(page.path)} selected={isActive(page.path)}>
                  <ListItemIcon>{page.icon}</ListItemIcon>
                  <ListItemText>{page.name}</ListItemText>
                </MenuItem>
              ))}
            </Menu>}
          </Box>

          {/* User Menu */}
          <Box sx={{ flexGrow: 0 }}>
            {user ? (
              <>
                <Tooltip title={user.name || 'Account'}>
                  <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
                      {userInitials}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={() => setAnchorElUser(null)}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => { setAnchorElUser(null); navigate('/profile'); }}>
                    <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                    <ListItemText>Profile & Settings</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<Login />} onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="contained" size="small" onClick={() => navigate('/register')}
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Sign Up
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;

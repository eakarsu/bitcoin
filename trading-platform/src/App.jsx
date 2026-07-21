import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import theme from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './components/shared/ConfirmDialog';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import AlgoTraderDashboard from './pages/AlgoTrader/Dashboard';
import SignalStreamDashboard from './pages/SignalStream/Dashboard';
import Pricing from './pages/SignalStream/Pricing';
import AIAnalyticsDashboard from './pages/AIAnalytics/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PasswordReset from './pages/Auth/PasswordReset';
import ProfileSettings from './pages/Profile/Settings';
import SignalsManagement from './pages/Management/Signals';
import StrategiesManagement from './pages/Management/Strategies';
import TradesManagement from './pages/Management/Trades';
import UsersManagement from './pages/Management/Users';
import About from './pages/Company/About';
import Contact from './pages/Company/Contact';
import Careers from './pages/Company/Careers';
import Support from './pages/Company/Support';
import Docs from './pages/Resources/Docs';
import API from './pages/Resources/API';
import Tutorials from './pages/Resources/Tutorials';
import Blog from './pages/Resources/Blog';
import Privacy from './pages/Legal/Privacy';
import Terms from './pages/Legal/Terms';
import Cookies from './pages/Legal/Cookies';
import NotFound from './pages/NotFound';
import GovernedTradingDashboard from './pages/GovernedTrading/Dashboard';

const demoEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_LEGACY_DEMO_SURFACES === 'true';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Router>
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                  <Navbar />
                  <Box component="main" sx={{ flexGrow: 1 }}>
                    <Routes>
                      <Route path="/" element={demoEnabled ? <Home /> : <GovernedTradingDashboard />} />
                      <Route path="/paper-trading" element={<GovernedTradingDashboard />} />
                      {demoEnabled && <Route path="/algotrader" element={<AlgoTraderDashboard />} />}
                      {demoEnabled && <Route path="/signalstream" element={<SignalStreamDashboard />} />}
                      {demoEnabled && <Route path="/pricing" element={<Pricing />} />}
                      {demoEnabled && <Route path="/ai-analytics" element={<AIAnalyticsDashboard />} />}

                      {/* Auth */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<PasswordReset />} />

                      {/* User */}
                      <Route path="/profile" element={<ProfileSettings />} />

                      {/* Management */}
                      {demoEnabled && <Route path="/manage/signals" element={<SignalsManagement />} />}
                      {demoEnabled && <Route path="/manage/strategies" element={<StrategiesManagement />} />}
                      {demoEnabled && <Route path="/manage/trades" element={<TradesManagement />} />}
                      {demoEnabled && <Route path="/manage/users" element={<UsersManagement />} />}

                      {/* Company Pages */}
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/support" element={<Support />} />

                      {/* Resources */}
                      <Route path="/docs" element={<Docs />} />
                      <Route path="/api" element={<API />} />
                      <Route path="/tutorials" element={<Tutorials />} />
                      <Route path="/blog" element={<Blog />} />

                      {/* Legal */}
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/cookies" element={<Cookies />} />

                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Box>
                  <Footer />
                </Box>
              </Router>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

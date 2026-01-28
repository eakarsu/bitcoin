import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import theme from './theme/theme';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import AlgoTraderDashboard from './pages/AlgoTrader/Dashboard';
import SignalStreamDashboard from './pages/SignalStream/Dashboard';
import Pricing from './pages/SignalStream/Pricing';
import AIAnalyticsDashboard from './pages/AIAnalytics/Dashboard';
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/algotrader" element={<AlgoTraderDashboard />} />
              <Route path="/signalstream" element={<SignalStreamDashboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/ai-analytics" element={<AIAnalyticsDashboard />} />

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
    </ThemeProvider>
  );
}

export default App;

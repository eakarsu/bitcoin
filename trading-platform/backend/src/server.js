import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import pool from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import governedTradingRoutes from './routes/governedTrading.js';
import { sanitizeInput } from './middleware/sanitize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const httpServer = createServer(app);
const production = process.env.NODE_ENV === 'production';
const legacyDemoEnabled = !production && process.env.ENABLE_LEGACY_DEMO_SURFACES === 'true';

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS configuration
if (production && !process.env.CORS_ORIGIN) throw new Error('CORS_ORIGIN is required in production');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

let io = null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'governed-paper-only' });
});

app.get('/health/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1 FROM gt_tenants LIMIT 1');
    res.json({ status: 'ready', database: true, mode: 'governed-paper-only' });
  } catch {
    res.status(503).json({ status: 'not-ready', database: false });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v2/trading', governedTradingRoutes);

const legacyPaths = ['/api/signals', '/api/portfolio', '/api/strategies', '/api/prices', '/api/ai', '/api/enhancements', '/api/trades'];
if (!legacyDemoEnabled) {
  for (const route of legacyPaths) app.use(route, (req, res) => res.status(410).json({ error: 'legacy demo surface disabled; use /api/v2/trading' }));
}

async function enableLegacyDemo() {
  if (!legacyDemoEnabled) return;
  const { Server } = await import('socket.io');
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
  });
  app.set('io', io);
  io.on('connection', (socket) => {
    socket.on('subscribe', (data) => { if (data.channel) socket.join(data.channel); });
  });
  const [
    { default: signalRoutes }, { default: portfolioRoutes },
    { default: strategyRoutes }, { default: priceRoutes },
    { default: aiRoutes }, { default: enhancementsRoutes },
    { default: tradeRoutes }, priceService, signalService, schedulerService,
  ] = await Promise.all([
    import('./routes/signals.js'), import('./routes/portfolios.js'),
    import('./routes/strategies.js'), import('./routes/prices.js'),
    import('./routes/ai.js'), import('./routes/enhancements.js'),
    import('./routes/trades.js'), import('./services/priceService.js'),
    import('./services/signalService.js'), import('./services/schedulerService.js'),
  ]);
  for (const [route, handler] of [
    ['/api/signals', signalRoutes], ['/api/portfolio', portfolioRoutes],
    ['/api/strategies', strategyRoutes], ['/api/prices', priceRoutes],
    ['/api/ai', aiRoutes], ['/api/enhancements', enhancementsRoutes],
    ['/api/trades', tradeRoutes],
  ]) app.use(route, handler);
  priceService.startPriceUpdates(io);
  signalService.startSignalGeneration(io);
  schedulerService.startScheduledTasks(io);
}

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = Number.isInteger(err.status) ? err.status : 500;
  if (statusCode >= 500) console.error('Error:', err.stack);
  res.status(statusCode).json({
    error: statusCode < 500 ? err.message : 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connection established');

    await enableLegacyDemo();

    httpServer.listen(PORT, () => {
      console.log(`\nBackend server running on http://localhost:${PORT}`);
      console.log(`API Health: http://localhost:${PORT}/health`);
      console.log(`Mode: ${legacyDemoEnabled ? 'development demo' : 'governed paper only'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startServer();
}

export { app, httpServer, io, startServer };

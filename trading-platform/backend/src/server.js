import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import signalRoutes from './routes/signals.js';
import portfolioRoutes from './routes/portfolios.js';
import strategyRoutes from './routes/strategies.js';
import priceRoutes from './routes/prices.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import enhancementsRoutes from './routes/enhancements.js';
import { startPriceUpdates } from './services/priceService.js';
import { startSignalGeneration } from './services/signalService.js';
import { startScheduledTasks } from './services/schedulerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Socket.IO for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trading Platform API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/enhancements', enhancementsRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id}`);

  socket.on('subscribe', (data) => {
    console.log(`Client ${socket.id} subscribed to:`, data);
    if (data.channel) {
      socket.join(data.channel);
    }
  });

  socket.on('disconnect', () => {
    console.log(`✗ Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection established');

    // Start real-time services
    startPriceUpdates(io);
    startSignalGeneration(io);

    // Start scheduled tasks (cron jobs)
    startScheduledTasks(io);

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
      console.log(`🔗 API Health: http://localhost:${PORT}/health`);
      console.log(`⏰ Scheduled tasks started\n`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

export { io };

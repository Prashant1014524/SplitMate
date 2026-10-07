import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 sPLIT Backend REST API is running!',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      groups: '/api/groups',
      expenses: '/api/expenses',
      settlements: '/api/settlements'
    }
  });
});

// Healthcheck Route
app.get('/api/health', (req, res) => {
  const dbUrl = process.env.DATABASE_URL || '';
  const host = dbUrl.split('@')[1] ? dbUrl.split('@')[1].split('/')[0] : 'not-set';
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'sPLIT Backend REST API',
    dbHost: host
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 sPLIT Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Healthcheck: http://localhost:${PORT}/api/health`);
});

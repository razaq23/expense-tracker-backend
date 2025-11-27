import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// THEN import routes (so they have access to process.env)
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js'; 
import reportRoutes from './routes/reports.js'; 
import categoryRoutes from './routes/categories.js';
import analyticsRoutes from './routes/analytics.js';
import { pool } from './config/database.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    "https://expense-tracker-frontend-u7tw.onrender.com",  
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);

// Add route logging to debug
console.log('🔍 Route registration:');
console.log('- /api/auth', typeof authRoutes);
console.log('- /api/transactions', typeof transactionRoutes);
// ... add for other routes

// Existing routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 Expense Tracker API is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      reports: '/api/reports',
      analytics: '/api/analytics' 
    }
  });
});

app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({ 
    registered_routes: routes,
    total_routes: routes.length
  });
});

app.get('/api/deploy-test', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT NOW()');
    const env = {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      database_url: process.env.DATABASE_URL ? 'Set' : 'Not set',
      jwt_secret: process.env.JWT_SECRET ? 'Set' : 'Not set'
    };
    
    res.json({
      status: 'deployment_test',
      server_time: new Date().toISOString(),
      database_time: dbTest.rows[0].now,
      environment: env,
      message: 'If you see this, deployment is partially working'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      deployment_issue: 'Database or environment problem'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Visit: http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`💳 Transaction routes: http://localhost:${PORT}/api/transactions`);
  console.log(`📈 Report routes: http://localhost:${PORT}/api/reports`);
});
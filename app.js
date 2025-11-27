import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {pool} from './config/database.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js' 
import reportRoutes from './routes/reports.js'; 
import categoryRoutes from './routes/categories.js';
import analyticsRoutes from './routes/analytics.js';




dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware


app.use(cors({
  origin: [
    "https://expense-tracker-frontend-u7tw.onrender.com",  
    "http://localhost:3000"                    // Local development
  ],
  credentials: true
}));




app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes); // Add this
app.use('/api/reports', reportRoutes); // Add this
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);

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

app.get('/api/deploy-test', async (req, res) => {
  try {
    // Test database
    const dbTest = await pool.query('SELECT NOW()');
    
    // Test environment
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
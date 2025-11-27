import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
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



app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Visit: http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`💳 Transaction routes: http://localhost:${PORT}/api/transactions`);
  console.log(`📈 Report routes: http://localhost:${PORT}/api/reports`);
});
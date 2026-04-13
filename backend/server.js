const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Validate required environment variables early
if (!process.env.JWT_SECRET) {
  console.error('❌ Missing required environment variable JWT_SECRET');
  process.exit(1);
}

const configuredMongoUri = process.env.MONGODB_URI?.trim();
const placeholderPattern = /<username>|<password>|cluster0\.|mongodb\+srv:\/\/.+\.mongodb\.net/i;
const MONGODB_URI = configuredMongoUri && !placeholderPattern.test(configuredMongoUri)
  ? configuredMongoUri
  : 'mongodb://127.0.0.1:27017/finance-tracker';

if (!configuredMongoUri || placeholderPattern.test(configuredMongoUri)) {
  console.warn('⚠️  MONGODB_URI is not configured or appears to be a placeholder. Falling back to local MongoDB at mongodb://127.0.0.1:27017/finance-tracker.');
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/summary', require('./routes/summary'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// MongoDB connection + server start
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the existing process or change PORT in .env.`);
        process.exit(1);
      }
      console.error('❌ Server error:', err);
      process.exit(1);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;

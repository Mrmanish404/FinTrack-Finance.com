const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is required');
  process.exit(1);
}

const rawMongoUri = process.env.MONGODB_URI?.trim();
const missingMongoUri = !rawMongoUri || /YOUR_ACTUAL|<username>|<password>/i.test(rawMongoUri);
const isDevMode = process.env.NODE_ENV !== 'production';
const mongoUri = missingMongoUri
  ? isDevMode
    ? 'mongodb://127.0.0.1:27017/finance-tracker'
    : null
  : rawMongoUri;

if (!mongoUri) {
  console.error('❌ MONGODB_URI must be configured with a valid connection string. Update backend/.env or run a local MongoDB instance when not in production.');
  process.exit(1);
}

if (missingMongoUri && isDevMode) {
  console.warn('⚠️ MONGODB_URI is not configured or still contains placeholders. Falling back to local MongoDB at mongodb://127.0.0.1:27017/finance-tracker');
}

// ✅ Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/summary', require('./routes/summary'));

// ✅ Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    time: new Date().toISOString()
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ✅ Start server only after DB connects
const PORT = process.env.PORT || 5000;

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
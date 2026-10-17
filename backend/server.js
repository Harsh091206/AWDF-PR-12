const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const taskRoutes = require('./routes/tasks');
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
require('./listeners');

const app = express();
const PORT = process.env.PORT || 5000;

// ----- Middleware -----

// Allow the React dev server (localhost:5173) to call this API
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Request logging middleware (method, url, timestamp) - applied globally
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// ----- Database connection -----
if (process.env.NODE_ENV !== 'test') {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';
  mongoose
    .connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
}

// ----- Routes -----
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Task Manager API is running' });
});

app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// ----- 404 handler for undefined routes -----
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// ----- Global error handling middleware (must be last) -----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

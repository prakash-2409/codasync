const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (try local .env first, then root .env)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { seedInitialContests } = require('./controllers/contestController');
const { initCronJobs } = require('./services/cronService');

// Route Imports
const redirectRoutes = require('./routes/redirectRoutes');
const userRoutes = require('./routes/userRoutes');
const contestRoutes = require('./routes/contestRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(async () => {
  await seedInitialContests();
  initCronJobs();
});

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Sienna OS - Placement Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/redirect', redirectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contests', contestRoutes);

// Centralized Error Handler
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`[Sienna OS Backend] Server active and listening on port ${PORT}`);
});

module.exports = { app, server };

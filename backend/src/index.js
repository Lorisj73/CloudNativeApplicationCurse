const express = require('express');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const logger = require('./logger');
const requestLogger = require('./middleware/requestLogger');
const { metricsMiddleware, initMetrics, register: metricsRegister } = require('./observability/metrics');

const userRoutes = require('./routes/userRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const classRoutes = require('./routes/classRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

initMetrics();

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:8081', 'http://localhost'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(metricsMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Whoami endpoint for load balancing verification
app.get('/whoami', (req, res) => {
  res.json({
    hostname: os.hostname(),
    container_id: os.hostname(),
    pid: process.pid,
    uptime: process.uptime(),
    platform: os.platform(),
    arch: os.arch(),
    node_version: process.version,
    memory_usage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsRegister.contentType);
    const metricsPayload = await metricsRegister.metrics();
    res.send(metricsPayload);
  } catch (error) {
    logger.error({ msg: 'metrics_error', error: error.message });
    res.status(500).send('Unable to collect metrics');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    msg: 'request_error',
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info({
    msg: 'server_started',
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    hostname: os.hostname()
  });
});

const pino = require('pino');
const os = require('os');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'gym-backend',
    hostname: os.hostname(),
    env: process.env.NODE_ENV || 'development'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;

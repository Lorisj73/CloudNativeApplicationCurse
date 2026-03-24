const os = require('os');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const requestId = uuidv4();
  req.id = requestId;

  logger.info({
    msg: 'request_start',
    requestId,
    method: req.method,
    path: req.originalUrl,
    hostname: os.hostname(),
    ip: req.ip
  });

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info({
      msg: 'request_complete',
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(2)),
      content_length: res.get('content-length') || 0,
      hostname: os.hostname()
    });
  });

  next();
};

module.exports = requestLogger;

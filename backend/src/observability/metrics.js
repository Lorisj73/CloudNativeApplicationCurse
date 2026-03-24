const client = require('prom-client');

const histogramBuckets = [
  0.005,
  0.01,
  0.025,
  0.05,
  0.1,
  0.25,
  0.5,
  1,
  2,
  5
];

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: histogramBuckets
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpActiveRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of in-flight HTTP requests'
});

let initialized = false;

const initMetrics = () => {
  if (initialized) {
    return;
  }
  client.collectDefaultMetrics({
    prefix: 'gym_',
    labels: { service: 'gym-backend' }
  });
  initialized = true;
};

const labelRoute = req => {
  if (req.route && req.route.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }
  return req.baseUrl || req.path || 'unknown_route';
};

const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics') {
    return next();
  }

  httpActiveRequests.inc();
  const endTimer = httpRequestDurationSeconds.startTimer();

  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: labelRoute(req),
      status_code: res.statusCode
    };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
    httpActiveRequests.dec();
  });

  next();
};

module.exports = {
  initMetrics,
  metricsMiddleware,
  register: client.register
};

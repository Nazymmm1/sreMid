// Prometheus Metrics Middleware for Express
// This file instruments your backend with Prometheus metrics

const promClient = require('prom-client');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'blog_'
});

// Custom Metrics

// 1. HTTP Request Duration Histogram (for latency tracking)
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5] // Response time buckets
});

// 2. HTTP Request Counter (for traffic/error rate)
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// 3. Active Users Gauge
const activeUsersGauge = new promClient.Gauge({
  name: 'active_users_total',
  help: 'Number of currently active users'
});

// 4. Database Query Duration
const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2]
});

// 5. Posts Created Counter
const postsCreatedCounter = new promClient.Counter({
  name: 'posts_created_total',
  help: 'Total number of posts created'
});

// 6. Login Attempts Counter
const loginAttemptsCounter = new promClient.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'] // success or failed
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);
register.registerMetric(activeUsersGauge);
register.registerMetric(dbQueryDuration);
register.registerMetric(postsCreatedCounter);
register.registerMetric(loginAttemptsCounter);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Track response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;
    const status = res.statusCode;
    
    // Record duration
    httpRequestDuration
      .labels(req.method, route, status)
      .observe(duration);
    
    // Increment request counter
    httpRequestCounter
      .labels(req.method, route, status)
      .inc();
  });
  
  next();
};

// Export everything
module.exports = {
  register,
  metricsMiddleware,
  metrics: {
    httpRequestDuration,
    httpRequestCounter,
    activeUsersGauge,
    dbQueryDuration,
    postsCreatedCounter,
    loginAttemptsCounter
  }
};

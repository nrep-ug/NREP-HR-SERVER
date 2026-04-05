import express from 'express';
import { randomUUID } from 'node:crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import client from 'prom-client';

const appLabel = process.env.APP_NAME || 'nrep-hr-gateway';
const envLabel = process.env.NODE_ENV || 'dev';

export const logger = pino(
  { level: process.env.LOG_LEVEL || 'info' }
);

// ---- Prometheus metrics (singleton) ----
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const reqCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const reqDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

register.registerMetric(reqCounter);
register.registerMetric(reqDuration);

export function metricsRouter() {
  const router = express.Router();
  const metricsSecret = process.env.METRICS_SECRET;

  router.get('/metrics', async (req, res) => {
    // If a METRICS_SECRET is configured, require it in the Authorization header
    if (metricsSecret) {
      const authHeader = req.headers['authorization'];
      const providedToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      if (providedToken !== metricsSecret) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }

    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  });
  return router;
}

// ---- Gateway: correlation-id + structured logs + metrics ----
export function requestAudit() {
  const httpLogger = pinoHttp({
    logger,
    // always set/propagate a correlation id
    genReqId: (req) => req.headers['x-correlation-id'] || randomUUID(),
    customProps: (req) => ({
      correlationId: req.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      app: appLabel,
      env: envLabel,
    }),
    customLogLevel: (res, err) => {
      if (err) return 'error';
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  });

  return function auditMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    httpLogger(req, res);

    // Set correlation ID header after pino-http processes the request
    if (req.id) res.setHeader('x-correlation-id', req.id);

    res.on('finish', () => {
      // keep route label low-cardinality
      const pathNoQuery = (req.originalUrl || '').split('?')[0];
      const route =
        req.route?.path ||
        (req.baseUrl ? `${req.baseUrl}/*` : pathNoQuery || 'unmatched');

      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      const labels = {
        method: req.method,
        route,
        status: String(res.statusCode),
      };
      reqCounter.inc(labels);
      reqDuration.observe(labels, seconds);
    });

    next();
  };
}
// Third-party imports
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Middleware
import errorHandler from './middlewares/errorHandler.js';
import { requestAudit, metricsRouter } from './middlewares/requestAudit.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import procureRoutes from './routes/procureRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import testEmailRoute from './routes/testEmailRoute.js';
import hrRoutes from './routes/hrRoutes.js';
import codeGenRoutes from './routes/codeGenRoutes.js';
import genRoutes from './routes/generalRoute.js';
import recRoutes from './routes/recRoute.js'; // Renewable Energy Conference routes

// Configurations
import corsOptions from './config/corsOptions.js';

const app = express();

// Set trust proxy for proper IP detection
app.set('trust proxy', 1);

// === Security Headers (helmet) ===
app.use(helmet());

// === Gateway Middleware (BEFORE any routes) ===
app.use(requestAudit());
app.use(metricsRouter());

// === Middleware ===
app.use(cors(corsOptions));
app.use(express.json());

// === Rate Limiters ===
// Rate limiting is disabled in test environments to prevent hanging timers.
const isTest = process.env.NODE_ENV === 'test';

// Strict limiter for authentication and sensitive endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: isTest ? 0 : 20,        // 0 = unlimited in test env
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,          // Skip entirely in test env
    message: { message: 'Too many requests from this IP, please try again later.' },
});

// Medium limiter for password reset / OTP flows (brute-force sensitive)
const sensitiveActionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: isTest ? 0 : 10,        // 0 = unlimited in test env
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,          // Skip entirely in test env
    message: { message: 'Too many requests from this IP, please try again later.' },
});

// === Test Routes ===
app.use('/api/test', testEmailRoute);

// === Main API Routes ===
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/procure', procureRoutes);
app.use('/api', contactRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/codegen', codeGenRoutes);
app.use('/api/general', genRoutes);
app.use('/api/rec', recRoutes); // Renewable Energy Conference routes

// === Error Handler ===
app.use(errorHandler);

export default app;
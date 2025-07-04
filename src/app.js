// Third-party imports
import express from 'express';
import cors from 'cors';

// Middleware
import errorHandler from './middlewares/errorHandler.js';

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

// === Middleware ===
app.use(cors(corsOptions));
app.use(express.json());

// === Test Routes ===
app.use('/api/test', testEmailRoute);

// === Main API Routes ===
app.use('/api/auth', authRoutes);
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
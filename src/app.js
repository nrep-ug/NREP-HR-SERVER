import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js'
import staffRoutes from './routes/staffRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import procureRoutes from './routes/procureRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import contactRoutes from './routes/contactRoutes.js';
import testEmailRoute from './routes/testEmailRoute.js';

const app = express();

// Define the allowed origins and base domain
const allowedOrigins = [
    'http://localhost:3000',          // Localhost
    'http://nrep.ug',             // nrep.ug without ssl
    'https://nrep.ug',            // nrep.ug with ssl
    'https://lkkz9p-3005.csb.app', // COODE-SANDBOX
    'https://v0-nrep-hr-system.vercel.app', // VERCEL
];

const allowedBaseDomain = '.nrep.ug'; // Allow all subdomains under nrep.ug

// Configure CORS
const corsOptions = {
    origin: (origin, callback) => {
        console.log('CORS Origin:', origin); // Log the origin for debugging
        if (allowedOrigins.includes(origin) ||
            (origin && origin.endsWith(allowedBaseDomain)) ||
            !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions));  // Enable CORS with the specified options
app.use(express.json());

// TESTING ROUTES
// Test email route
app.use('/api/test', testEmailRoute);

// MAIN ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/procure', procureRoutes)
app.use('/api', contactRoutes);

app.use(errorHandler);

export default app;

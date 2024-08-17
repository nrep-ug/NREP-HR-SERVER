import express from 'express';
import cors from 'cors';
import staffRoutes from './routes/staffRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Define the allowed origins and base domain
const allowedOrigins = [
    'http://localhost:3000',          // Localhost
    'http://nrep.ug',             // nrep.ug without ssl
    'https://nrep.ug',            // nrep.ug with ssl
];

const allowedBaseDomain = '.nrep.ug'; // Allow all subdomains under nrep.ug

// Configure CORS
const corsOptions = {
    origin: (origin, callback) => {
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

app.use('/api/staff', staffRoutes);

app.use(errorHandler);

export default app;

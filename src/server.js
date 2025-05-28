// Load environment variables and dependencies
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import logger from './utils/logger.js';

// Set port with fallback
const PORT = process.env.PORT || 3005;

// Start server
app.listen(PORT, (err) => {
    if (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
    logger.info(`NREP HR Backend Server Side Service is running on port ${PORT}`);
});
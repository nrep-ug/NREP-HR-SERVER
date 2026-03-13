import logger from '../utils/logger.js';

/**
 * Global error handler middleware.
 * In production, hides internal error details from API consumers.
 * In development, returns the full error message for easier debugging.
 */
export default (err, req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log full error details server-side regardless of environment
    logger.error({
        msg: err.message,
        stack: err.stack,
        correlationId: req.id,
        method: req.method,
        url: req.originalUrl,
    });

    const statusCode = err.status || err.statusCode || 500;

    res.status(statusCode).json({
        message: isProduction
            ? 'An unexpected error occurred. Please try again later.'
            : err.message,
    });
};
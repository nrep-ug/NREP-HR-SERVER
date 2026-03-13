/**
 * CORS allowed origins are configured via environment variables:
 *
 *   CORS_EXTRA_ORIGINS   – comma-separated list of additional whitelisted origins
 *                          e.g. "https://alx.derrickml.com,http://alx.derrickml.com"
 *   CORS_BASE_DOMAINS    – comma-separated wildcard base-domain suffixes
 *                          e.g. ".nrep.ug,.vercel.app"
 *
 * The local development origins and the hardcoded production origins below
 * act as safe defaults; CORS_EXTRA_ORIGINS is appended at runtime.
 */

const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://nrep.ug',
    'https://nrep.ug',
    'http://hr.nrep.ug',
    'https://hr.nrep.ug',
    'https://lkkz9p-3005.csb.app',
    'http://45.148.31.38:3030',
    'http://45.148.31.38:3100',
];

// Additional origins injected at runtime (e.g. alx.derrickml.com)
const extraOrigins = process.env.CORS_EXTRA_ORIGINS
    ? process.env.CORS_EXTRA_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [];

const allowedOrigins = [...defaultOrigins, ...extraOrigins];

// Base-domain suffixes (any subdomain of these is allowed)
const allowedBaseDomains = process.env.CORS_BASE_DOMAINS
    ? process.env.CORS_BASE_DOMAINS.split(',').map(d => d.trim()).filter(Boolean)
    : ['.nrep.ug', '.vercel.app'];

const corsOptions = {
    origin: (origin, callback) => {
        if (
            !origin ||
            allowedOrigins.includes(origin) ||
            allowedBaseDomains.some(base => origin.endsWith(base))
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

export default corsOptions;
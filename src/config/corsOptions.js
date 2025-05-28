const allowedOrigins = [
    'http://localhost:3000',
    'http://nrep.ug',
    'https://nrep.ug',
    'http://hr.nrep.ug',
    'https://hr.nrep.ug',
    'https://lkkz9p-3005.csb.app',
];

const allowedBaseDomains = [
    '.vercel.app',
    '.nrep.ug'
];

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
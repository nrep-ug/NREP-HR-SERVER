// src/utils/multerConfig.js

import multer from 'multer';
import path from 'path';

export const configureMulter = ({ allowedFileTypes = [], maxSizeMB = 5 } = {}) => {
    // Use memory storage to avoid saving files to disk
    const storage = multer.memoryStorage();

    // Set up multer
    const upload = multer({
        storage: storage,
        limits: { fileSize: maxSizeMB * 1024 * 1024 }, // Convert MB to bytes
        fileFilter: (req, file, cb) => {
            if (allowedFileTypes.length > 0) {
                const filetypes = new RegExp(allowedFileTypes.join('|'), 'i'); // Create regex from allowedFileTypes array
                const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
                const mimetype = filetypes.test(file.mimetype);

                if (extname && mimetype) {
                    return cb(null, true);
                } else {
                    return cb(new Error(`File type must be one of the following: ${allowedFileTypes.join(', ')}`));
                }
            } else {
                cb(null, true); // Allow all file types if no specific types are defined
            }
        }
    });

    return upload;
};

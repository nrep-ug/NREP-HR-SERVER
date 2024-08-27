// src/config/multerConfig.js
import multer from 'multer';

// Define memory storage for multer
const storage = multer.memoryStorage();

// File filter function to restrict file types
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'ods', 'csv'];
    const fileExtension = file.originalname.split('.').pop().toLowerCase();

    if (allowedFileTypes.includes(fileExtension)) {
        cb(null, true);  // Accept file
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, DOC, XLSX, XLS, ODS, and CSV files are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 30 * 1024 * 1024 // 10 MB max file size
    }
});

export default upload;

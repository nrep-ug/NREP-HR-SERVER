// src\validations\procureValidation.js
import { body, query, validationResult } from 'express-validator';

export const validateSupplier = [
    body('name')
        .isString().withMessage('Company name must be a string')
        .notEmpty().withMessage('Company name is required'),

    body('contactPerson')
        .isString().withMessage('Contact person must be a string')
        .notEmpty().withMessage('Contact person is required'),

    body('email')
        .isEmail().withMessage('Invalid email')
        .notEmpty().withMessage('Email is required'),

    body('phone')
        .isString().withMessage('Phone must be a string')
        .notEmpty().withMessage('Phone is required'),

    body('contactPersonEmail')
        .isEmail().withMessage('Invalid email')
        .notEmpty().withMessage('Email is required'),

    body('contactPersonPhone')
        .isString().withMessage('Phone must be a string')
        .notEmpty().withMessage('Phone is required'),

    body('address')
        .isString().withMessage('Address must be a string')
        .notEmpty().withMessage('Address is required'),

    body('country')
        .isString().withMessage('Country must be a string')
        .notEmpty().withMessage('Country is required'),

    body('city')
        .isString().withMessage('City must be a string')
        .notEmpty().withMessage('City is required'),

    body('productsServices')
        .isArray({ min: 1 }).withMessage('Products/Services must be at least one Service/Product offered')
        .custom((array) => array.every(item => typeof item === 'string')).withMessage('All products/services must be strings'),

    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .notEmpty().withMessage('Password is required'),
];

export const validateSignIn = [
    body('password')
        .isString().withMessage('Password must be a string')
        .notEmpty().withMessage('Password is required'),

    body('email')
        .isEmail().withMessage('Invalid email')
        .notEmpty().withMessage('Email is required'),
];

export const validateGetAllServices = [
    query('all')
        .optional()
        .isBoolean().withMessage('The "all" parameter must be a boolean'),

    query('expired')
        .optional()
        .isBoolean().withMessage('The "expired" parameter must be a boolean'),

    query('status')
        .optional()
        .isString().withMessage('The "status" parameter must be a string')
        .isIn(['active', 'inactive', 'pending', 'completed']).withMessage('The "status" parameter must be one of: active, inactive, pending, completed')
];

export const validateProcurementApplication = [
    body('procurementID').notEmpty().withMessage('Procurement ID is required.'),
    body('supplierID').notEmpty().withMessage('Supplier ID is required.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!req.files || !req.files['incorporationCertificate'] || !req.files['teamCv'] || !req.files['budget']) {
            return res.status(400).json({ error: 'All documents marked with an asterik (*) are required.' });
        }
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

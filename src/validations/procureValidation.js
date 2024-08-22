// src\validations\procureValidation.js
import { body } from 'express-validator';

export const validateSupplier = [
    body('companyName')
        .isString().withMessage('Company name must be a string')
        .notEmpty().withMessage('Company name is required'),

    body('contactPerson')
        .isString().withMessage('Contact person must be a string')
        .notEmpty().withMessage('Contact person is required'),

    body('email')
        .isEmail().withMessage('Invalid email')
        .notEmpty().withMessage('Email is required'),

    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .notEmpty().withMessage('Password is required'),

    body('phone')
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
        .custom((array) => array.every(item => typeof item === 'string')).withMessage('All products/services must be strings')
];


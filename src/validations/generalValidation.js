import { body, query, param, validationResult } from 'express-validator';

export const validateSendStaffEmail = [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .notEmpty().withMessage('Email is required'),
    body('subject')
        .isString().withMessage('Subject must be a string')
        .notEmpty().withMessage('Subject is required'),
    body('text')
        .isString().withMessage('Text must be a string')
        .notEmpty().withMessage('Text is required'),
    body('cc')
        .optional()
        .isEmail().withMessage('Invalid CC email format'),
    body('bcc')
        .optional()
        .isEmail().withMessage('Invalid BCC email format'),
];
import { body, query, param, validationResult } from 'express-validator';

export const validateRegConfirmation = [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .notEmpty().withMessage('Email is required'),
    body('subject')
        .isString().withMessage('Subject must be a string')
        .notEmpty().withMessage('Subject is required'),
    body('text')
        .isString().withMessage('Text must be a string')
        .notEmpty().withMessage('Text is required'),
    body('eventStart')
        .isISO8601().withMessage('Event start date must be a valid ISO 8601 date')
        .notEmpty().withMessage('Event start date is required'),
    body('eventEnd')
        .isISO8601().withMessage('Event end date must be a valid ISO 8601 date')
        .notEmpty().withMessage('Event end date is required'),
    body('cc')
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null || value === '') return true;
            // allow empty or null, otherwise must be valid email
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }).withMessage('Invalid CC email format'),
    body('bcc')
        .optional({ nullable: true })
        .custom((value) => {
            if (value === null || value === '') return true;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }).withMessage('Invalid BCC email format'),
];
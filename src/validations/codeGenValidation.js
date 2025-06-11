import { body } from 'express-validator';

export const codeGenValidation = [
    body('prefix')
        .isString()
        .withMessage('Prefix must be a string')
        .trim(),
    body('length')
        .notEmpty()
        .withMessage('Length is required')
        .isInt({ min: 1 })
        .withMessage('Length must be a positive integer'),
];
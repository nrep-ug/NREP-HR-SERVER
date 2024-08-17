import { body } from 'express-validator';

export const createStaff = [
    body('staffID').not().isEmpty().withMessage('Staff ID is required'),
    body('firstName').not().isEmpty().withMessage('First Name is required'),
    body('surName').not().isEmpty().withMessage('SurName is required'),
    body('email1').isEmail().withMessage('Invalid email'),
    // body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];
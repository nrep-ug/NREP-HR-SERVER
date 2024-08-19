import { body } from 'express-validator';

export const userSignin = [
    body('userID').not().isEmpty().withMessage('User ID is required'),
    body('password').not().isEmpty().withMessage('Password is required'),
];
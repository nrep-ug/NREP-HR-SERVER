import { body } from 'express-validator';

export const userSignin = [
    body('userID').not().isEmpty().withMessage('User ID is required'),
    body('password').not().isEmpty().withMessage('Password is required'),
];

export const requestOTP = [
    body('email').not().isEmpty().withMessage('Email is required'),
    body('timeValidity').not().isEmpty().withMessage('Time validity is required'),
];
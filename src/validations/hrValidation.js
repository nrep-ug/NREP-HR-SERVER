import { body } from 'express-validator';

export const validateDeleteUserAccount = [
    body('userID')
        .notEmpty()
        .withMessage('User ID is required.')
        .isString()
        .trim()
        .escape(),
    // body('reason')
    //     .notEmpty()
    //     .withMessage('Reason for deletion is required.')
    //     .isString()
    //     .trim()
    //     .escape(),
    // body('confirmation')
    //     .notEmpty()
    //     .withMessage('Confirmation is required.')
    //     .isBoolean()
];
import { param } from 'express-validator';

export const validateDeleteUserAccount = [
    param('id')
        .notEmpty()
        .withMessage('User ID is required.')
        .isString()
        .trim()
        .escape(),
    /**
     * The Below fields are commented out as they are not currently used. They'll be implemented from the frontend in the future.
    */
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
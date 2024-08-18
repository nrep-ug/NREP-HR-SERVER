import { body } from 'express-validator';

export const createProject = [
    // body('projectID').not().isEmpty().withMessage('project ID is required'),
    body('name').not().isEmpty().withMessage('Project Name is required'),
    body('createdBy').not().isEmpty().withMessage('created By is required'),
    // body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];
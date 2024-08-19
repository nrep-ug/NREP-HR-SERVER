import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';

export const userSignin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const project = await authService.userSignin(req.body);
        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};
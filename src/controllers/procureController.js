import { validationResult } from 'express-validator';
import * as procureService from '../services/procureService.js';

// Rewgister Service Provider
export const signUp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const procure = await procureService.signUp(req.body);
        res.status(201).json(procure);
    } catch (error) {
        next(error);
    }
};

// Sign in Provider
export const signIn = async (req, res, next) => {
    try {
        // Validate incoming request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Call the signIn service with the request body
        const result = await procureService.signIn(req.body);

        if (!result.status) {
            return res.status(401).json({ message: result.message });
        }

        // Return success response with user data
        res.status(200).json({
            success: result.success !== undefined ? result.success : false,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

// Return valid or non-expired services
export const getAllServices = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Destructure and set default values
        const { all = false, expired = false, status = null } = req.query;

        // Convert 'all' and 'expired' from string to boolean and pass to the service
        const procure = await procureService.getAllServices(
            all === 'true',       // 'true' string becomes true, others become false
            expired === 'true',   // 'true' string becomes true, others become false
            status                // Pass status as it is (string or null)
        );

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

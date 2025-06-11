// src/controllers/codeGenController.js
import { validationResult } from 'express-validator';
import * as codeGenService from '../services/codeGenService.js';
/**
 * Controller to handle unique code generation requests.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateUniqueCode = async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { prefix, length } = req.body;

    try {
        // Generate the unique code using the service
        const code = await codeGenService.generateUniqueCode(prefix, length);
        return res.status(201).json({ code });
    } catch (error) {
        next(error);
    }
}
    
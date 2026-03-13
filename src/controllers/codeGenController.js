// src/controllers/codeGenController.js
import { validationResult } from 'express-validator';
import * as codeGenService from '../services/codeGenService.js';

/**
 * Controller to handle unique code generation requests.
 */
export const generateUniqueCode = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { prefix, length } = req.body;
    const code = await codeGenService.generateUniqueCode(prefix, length);
    return res.status(201).json({ code });
};
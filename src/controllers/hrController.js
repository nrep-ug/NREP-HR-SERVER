import { validationResult } from 'express-validator';
import * as hrService from '../services/hr/hrService.js';

export const deleteUserAccount = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.params.id;
        const response = await hrService.deleteUserAccountSerice(userId);

        if (response.success) {
            return res.status(200).json({ message: response.message });
        } else {
            return res.status(500).json({ message: response.message || 'Failed to delete user account.' });
        }
    } catch (error) {
        next(error);
    }
}
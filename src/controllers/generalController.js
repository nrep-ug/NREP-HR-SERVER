import { validationResult } from 'express-validator';
import * as generalServices from '../services/generalServices.js';

/**
 * Controller to handle general operations like sending staff emails.
 */
export const sendStaffEmail = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, subject, text, html, cc, bcc } = req.body;

    // Errors auto-propagate to the global error handler in Express 5
    const response = await generalServices.sendStaffEmail({ email, subject, text, html, cc, bcc });
    return res.status(200).json(response);
};
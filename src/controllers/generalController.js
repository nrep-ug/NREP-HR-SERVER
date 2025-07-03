import { validationResult } from 'express-validator';
import * as generalServices from '../services/generalServices.js';

/** * Controller to handle general operations like generating unique codes.
 */
export const sendStaffEmail = async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {  email, subject, text, cc, bcc } = req.body;

    try {
        // Call the service to send the email
        const response = await generalServices.sendStaffEmail({  email, subject, text, cc, bcc });
        return res.status(200).json(response);
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
import { validationResult } from "express-validator";
import * as recService from "../services/rec/recService.js";

/** Controller to hande the Renewable Energy Conference (REC) */
export const sendRegConfirmationEmail = async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Extract data from request body
    const { year, email, subject, text, cc, bcc, eventEnd, eventStart  } = req.body;

    try {
        // Call the service to send the email
        const response = await recService.sendRegConfirmationEmail({ year, email, subject, text, cc, bcc, eventEnd, eventStart });
        return res.status(200).json(response);
    } catch (error) {
        console.error('Error sending registration confirmation email:', error);
        return res.status(500).json({ error: 'Failed to send registration confirmation email' });
    }
}
import { validationResult } from "express-validator";
import * as recService from "../services/rec/recService.js";

/** Controller to handle the Renewable Energy Conference (REC) */
export const sendRegConfirmationEmail = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { year, email, subject, text, cc, bcc, eventEnd, eventStart } = req.body;

    // Errors auto-propagate to the global error handler in Express 5
    const response = await recService.sendRegConfirmationEmail({ year, email, subject, text, cc, bcc, eventEnd, eventStart });
    return res.status(200).json(response);
};
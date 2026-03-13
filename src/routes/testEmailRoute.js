// src/routes/testEmailRoute.js
import express from 'express';
import { sendEmail } from '../utils/utils.js'; // Import your email function

const router = express.Router();

/**
 * Test email endpoint — protected by ADMIN_KEY to prevent abuse.
 * Only accessible if the request includes the correct X-Admin-Key header.
 * Set ADMIN_KEY in your .env file.
 */
router.post('/send-test-email', async (req, res) => {
    // Guard: require admin key header
    const adminKey = process.env.ADMIN_KEY;
    if (adminKey) {
        const providedKey = req.headers['x-admin-key'];
        if (!providedKey || providedKey !== adminKey) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
    }

    try {
        const { to, subject, html, text } = req.body; // Get email details from the request

        // Call the sendEmail function
        const response = await sendEmail({
            to: to || 'derrickmaiku@gmail.com', // Default recipient if none provided
            subject: subject || 'Test Email from Postmark',
            html: html || '<h1>Hello!</h1><p>This is a test email sent using Postmark.</p>',
            text: text || 'Hello! This is a test email sent using Postmark.',
        });

        res.status(200).json({ success: true, message: 'Email sent successfully!', response });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
    }
});

export default router;

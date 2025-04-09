// src/routes/testEmailRoute.js
import express from 'express';
import { sendEmail } from '../utils/utils.js'; // Import your email function

const router = express.Router();

// Test email endpoint
router.post('/send-test-email', async (req, res) => {
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

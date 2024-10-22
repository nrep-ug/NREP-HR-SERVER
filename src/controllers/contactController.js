// src/controllers/contactController.js
import { validationResult } from 'express-validator';
import { sendEmail } from '../utils/utils.js';

export const handleContactForm = async (req, res) => {
  try {
    // Validate incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, subject, message, from } = req.body;

    // Construct email content
    const htmlContent = `
      <p>You have a new message from the contact form:</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    const textContent = `
      You have a new message from the contact form:

      Name: ${name}
      Email: ${email}
      Subject: ${subject}
      Message:
      ${message}
    `;

    // Send email to support team
    await sendEmail({
      to: process.env.NREP_EMAIL_HELP_PASS,
      subject: `${from==='procurement' ? 'Procurement Portal':null} Contact Form Submission: ${subject}`,
      html: htmlContent,
      text: textContent,
      replyTo: email, // Set reply-to to the user's email
      department: from==='procurement' ? 'Procurement':null,
      cc: [process.env.NREP_EMAIL_REPLY_TO]
    });

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error handling contact form submission:', error);
    res.status(500).json({ success: false, message: 'An error occurred while sending your message.' });
  }
};

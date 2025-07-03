import { sendEmail } from '../utils/utils.js';

/** * Sends email to specified recipient.
 * * @param {Object} data - Data containing email details.
 * * @param {string} data.email - The email address of the recipient.
 */
export const sendStaffEmail = async (data) => {

    try {
        // // Validate email format
        // if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
        //     return res.status(400).json({ error: 'Invalid email format' });
        // }

        // Send email using utility function
        const sendingEmail = await sendEmail({to:data.email, subject:data.subject, text:data.text, cc:data.cc?data.cc:null, bcc:data.bcc?data.bcc:null});

        return sendingEmail
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}

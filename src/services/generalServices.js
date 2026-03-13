import { sendEmail } from '../utils/utils.js';

/** * Sends email to specified recipient.
 * * @param {Object} data - Data containing email details.
 * * @param {string} data.email - The email address of the recipient.
 */
export const sendStaffEmail = async (data) => {
    // Send email using utility function
    // Errors will propagate to the caller (controller) which has the `res` object
    const sendingEmail = await sendEmail({
        to: data.email,
        subject: data.subject,
        text: data.text,
        cc: data.cc ? data.cc : null,
        bcc: data.bcc ? data.bcc : null,
    });

    return sendingEmail;
}

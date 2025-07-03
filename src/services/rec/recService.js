// src/services/rec/recService.js
// This file contains the service for sending registration confirmation emails for the Renewable Energy Conference (REC).
import { sendEmail, generateCalendarInvite } from "../../utils/utils.js";

/** Send conference email registration confirmation to registrant.
 * @param {Object} data - Data containing email details.
 * @param {string} data.email - The email address of the recipient.
 * @param {string} data.subject - The subject of the email.
 * @param {string} data.text - The body text of the email.
 * @param {string} [data.cc] - Optional CC email address.
 * @param {string} [data.bcc] - Optional BCC email address.
 * @returns {Promise<Object>} - Response object indicating success or failure.
 * @throws {Error} - If email sending fails.
 */
export const sendRegConfirmationEmail = async (data) => {
  try {
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // 1) Build the calendar attachment
    const calendarAttachment = generateCalendarInvite({
      domain: 'nrep.ug',
      prodId: { company: 'NREP', product: 'REC' },
      start: data.eventStart,
      end:   data.eventEnd,
      summary: data.eventSummary,
      description: data.subject,
      location: data.eventLocation,
      organizer: {
        name: 'NREP Secretariat',
        email: 'info@nrep.ug'
      },
      attendees: [
        { name: data.email.split('@')[0], email: data.email, rsvp: true }
      ]
    });

    // 2) Send the email with HTML + calendar
    const result = await sendEmail({
      to:         data.email,
      subject:    data.subject,
      html:       data.text,
      cc:         data.cc || null,
      bcc:        data.bcc || null,
      attachments:[ calendarAttachment ]
    });

    return result;
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    throw new Error('Failed to send email with calendar invite');
  }
};
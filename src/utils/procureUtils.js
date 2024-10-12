import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import moment from 'moment-timezone';
import {
    storage,
    databases,
    Query,
    ID,
    procureDatabaseId,
    procurePostsTableId,
    procureSupplierApplicationTableId,
    procureSupplierTableId,
    procureStaffTableId,
    procureCategoryTableId,
    procurePostBucketId,
} from '../config/appwrite.js';
import dotenv from 'dotenv';
import fsSync from 'fs'; // Import the regular fs module for synchronous operations

dotenv.config();

const counterFilePath = path.resolve('./src/data/procurementCounter.json'); // Path to the counter file
const counterDir = path.dirname(counterFilePath); // Directory path

/**
 * Generates a unique ID in the format NREP-{TYPE}-YYYY-NNNN
 * @param {string} type - The type of ID to generate ('PR' for procurement requests, 'PS' for procurement posts, 'SR' for supplier registration)
 * @returns {Promise<string>} The unique ID
 */
export async function generateUniqueId(type) {
    try {
        // Ensure the directory exists
        await fs.mkdir(counterDir, { recursive: true });

        let data;

        // Check if the file exists and read its content, or initialize the counter
        try {
            data = await fs.readFile(counterFilePath, 'utf-8');
        } catch (error) {
            if (error.code === 'ENOENT') { // If the file does not exist
                data = JSON.stringify({
                    procurementRequestCounter: 0,
                    procurementPostCounter: 0,
                    supplierRegistrationCounter: 0
                });
                await fs.writeFile(counterFilePath, data);
            } else {
                throw error; // Rethrow if another error occurred
            }
        }

        const counterData = JSON.parse(data);

        // Determine the key based on the type
        let counterKey;
        let idPrefix;

        switch (type) {
            case 'PR':
                counterKey = 'procurementRequestCounter';
                idPrefix = 'PRA';
                break;
            case 'PS':
                counterKey = 'procurementPostCounter';
                idPrefix = 'PRF';
                break;
            case 'SR':
                counterKey = 'supplierRegistrationCounter';
                idPrefix = 'SPL';
                break;
            case 'CAT':
                counterKey = 'procurementCategoryCounter';
                idPrefix = 'CAT';
                break;
            default:
                throw new Error('Invalid type provided for ID generation');
        }

        // Initialize the counter if the key doesn't exist
        if (!counterData.hasOwnProperty(counterKey)) {
            counterData[counterKey] = 0;
        }

        // Increment the relevant counter
        counterData[counterKey] += 1;

        // Save the updated counter back to the file
        await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

        const currentYear = new Date().getFullYear();
        const formattedCounter = String(counterData[counterKey]).padStart(3, '0');

        // Generate the unique ID in the format NREP-{TYPE}-YYYY-NNNN
        const uniqueId = `NREP-${idPrefix}-${currentYear}-${formattedCounter}`;

        return uniqueId;

    } catch (error) {
        console.error('Error generating unique ID:', error);
        throw new Error('Could not generate unique ID');
    }
}

// Helper function to check if supplier login email exists in the system
export const checkEmailExists = async (userEmail) => {
    const response = await databases.listDocuments(
        procureDatabaseId,
        procureSupplierTableId,
        [
            Query.equal('accountEmail', userEmail)
        ]
    )

    console.log('Account Email Check Response: ', response);

    return { exist: response.documents.length === 1, data: response.documents };

};

/**
 * PASSWORD RESET UTILS
 */
// Function to send an email
export const sendPassResetEmail = async (to, subject, body, type) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.NREP_EMAIL_HOST,
            port: process.env.NREP_EMAIL_PORT,
            secure: process.env.NREP_EMAIL_SECURE,
            auth: {
                user: process.env.NREP_EMAIL_HELP,
                pass: process.env.NREP_EMAIL_HELP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.NREP_EMAIL_HELP,
            to,
            subject,
            html: body,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Function to generate the HTML email content
export const generateEmailContent = (userEmail, resetCode) => {
    return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your account associated with the email address: <strong>${userEmail}</strong>.</p>
        <p>Your password reset code is: <span style="font-size: 16px; font-weight: bold; color: #FF5722;">${resetCode}</span></p>
        <p>Please use this code to reset your password. The code will expire in 30 minutes.</p>
        <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
        <p>Thank you,</p>
        <p>NREP IT Support Team</p>
    </div>
    `;
};

// Function to generate email content for status updates with disclaimer
export const generateStatusUpdateEmailContent = (procureRefNo, procureTitle, supplierName, applicationID, status, comments) => {
    const statusMessages = {
      pending: 'Your application is currently pending review.',
      under_review: 'Your application is under review.',
      approved: 'Congratulations! Your application has been approved.',
      rejected: 'We regret to inform you that your application has been rejected.',
      on_hold: 'Your application is currently on hold.',
      needs_more_info: 'We need more information to proceed with your application.',
    };
  
    const message = statusMessages[status] || 'Your application status has been updated.';
  
    // Define the disclaimer text
    const disclaimer = `
      <p style="font-size:12px; color:#777777; margin-top:20px; border-top:1px solid #e0e0e0; padding-top:10px;">
        This email and any attachments are intended solely for the use of the individual or entity to whom they are addressed and may contain confidential and privileged information. If you are not the intended recipient, please notify the sender immediately and delete this email from your system. Any unauthorized use, disclosure, or distribution is prohibited.
      </p>
    `;
  
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Status Update</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  width: 100%;
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  padding: 20px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                  text-align: center;
                  padding-bottom: 20px;
                  border-bottom: 1px solid #e0e0e0;
                  background-color: #ffffff;
              }
              .header img {
                  max-width: 150px;
              }
              .content {
                  padding: 20px 0;
              }
              .content p {
                  line-height: 1.6;
                  color: #333333;
              }
              .button-container {
                  text-align: center;
                  margin: 30px 0;
              }
              .button {
                  background-color: #007BFF;
                  color: #ffffff;
                  padding: 12px 25px;
                  text-decoration: none;
                  border-radius: 5px;
                  font-size: 16px;
              }
              .button:hover {
                  background-color: #0056b3;
              }
              .footer {
                  text-align: center;
                  font-size: 12px;
                  color: #777777;
                  border-top: 1px solid #e0e0e0;
                  padding-top: 20px;
                  margin-top: 20px;
              }
              @media only screen and (max-width: 600px) {
                  .container {
                      padding: 15px;
                  }
                  .button {
                      width: 100%;
                      box-sizing: border-box;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="https://supplies.nrep.ug/images/NREP-WHITE.jpg" alt="Company Logo">
              </div>
              <div class="content">
                  <p>Dear ${supplierName},</p>
                  <p>${message}</p>
                  <p><strong>Procurement:</strong> ${procureTitle}</p>
                  <p><strong>Procurement Reference Number:</strong> ${procureRefNo}</p>
                  <p><strong>Application ID:</strong> ${applicationID}</p>
                  ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
                  <div class="button-container">
                      <a href="https://supplies.nrep.ug/sign-in" class="button">View Your Update</a>
                  </div>
                  <p>If you have any questions or need further assistance, feel free to contact our support team.</p>
                  ${disclaimer}
              </div>
              <div class="footer">
                  <p>Best regards,<br>Procurement Department,<br>National Renewable Energy Platform (NREP)</p>
                  <p>&copy; ${new Date().getFullYear()} National Renewable Energy Platform (NREP). All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  
    const textDisclaimer = `
This email and any attachments are intended solely for the use of the individual or entity to whom they are addressed and may contain confidential and privileged information. If you are not the intended recipient, please notify the sender immediately and delete this email from your system. Any unauthorized use, disclosure, or distribution is prohibited.
    `;
  
    const text = `
Dear ${supplierName},

${message}

Application ID: ${applicationID}

${comments ? `Comments: ${comments}` : ''}

You can view your update by logging into your account here: https://supplies.nrep.ug/sign-in

If you have any questions or need further assistance, feel free to contact our support team.

Best regards,
Procurement Department,
National Renewable Energy Platform (NREP)

© ${new Date().getFullYear()} National Renewable Energy Platform (NREP). All rights reserved.

${textDisclaimer}
    `;
  
    return { html, text };
};

// Function to save the password reset request to the JSON file
export const savePasswordResetRequest = async (userEmail, resetCode) => {
    const filePath = path.resolve('src/data/passwordReset.json');

    // Use moment-timezone to get the current date and time in the desired format
    const dateTime = moment().tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss'); // Adjust timezone as needed

    let existingRequests = [];
    if (fsSync.existsSync(filePath)) { // Use fsSync.existsSync
        const fileContent = await fs.readFile(filePath, 'utf8'); // Use fs.promises.readFile
        existingRequests = fileContent ? JSON.parse(fileContent) : [];
    }

    const newRequest = {
        userEmail,
        code: resetCode,
        dateTime,
        isUsed: false,
    };

    existingRequests.push(newRequest);

    await fs.writeFile(filePath, JSON.stringify(existingRequests, null, 2), 'utf8'); // Use fs.promises.writeFile
};
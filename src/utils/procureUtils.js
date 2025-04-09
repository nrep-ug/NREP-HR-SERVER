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
export const generateStatusUpdateEmailContent = (
    procureRefNo,
    procureTitle,
    supplierName,
    applicationID,
    status,
    comments
  ) => {
    const currentYear = new Date().getFullYear();
  
    const rejectionMessage = `
      <p>
      We appreciate your effort in submitting a proposal for the <strong>${procureTitle}</strong> under the National Renewable Energy Platform (NREP).
      </p>
   <!-- <p>
       After careful evaluation, we regret to inform you that your application was not selected for further consideration. We encourage you to stay connected with us for future opportunities.
      </p>    -->
      <p>
      After careful consideration and thorough evaluation of all submissions, we regret to inform you that application was not selected for further consideration to proceed to the next phase. 
      This decision was based on a competitive process assessing various aspects including technical and financial criteria, as well as alignment with the project’s objectives.
      </p>
      <p>
      We highly value the expertise and commitment demonstrated in your submission, and we encourage you to continue engaging with us. 
      Please keep an eye on our <a href="https://supplies.nrep.ug">website</a> and <a href="https://supplies.nrep.ug/procurement">procurement portal</a> for updates on future opportunities that may align with your capabilities and interests.
      </p>
      <p>
      We deeply appreciate your interest in partnering with NREP to advance renewable energy initiatives in Uganda, and we hope to collaborate with you in the near future.
      </p>
    
      `;
  
    const disclaimer = `
      <p style="font-size:12px; color:#777777; margin-top:20px; border-top:1px solid #e0e0e0; padding-top:10px;">
        This email and any attachments are intended solely for the use of the individual or entity to whom they are addressed and may contain confidential and privileged information. If you are not the intended recipient, please notify the sender immediately and delete this email from your system. Any unauthorized use, disclosure, or distribution is prohibited.
      </p>
    `;
  
    const html = `
      <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
          /* CLIENT-SPECIFIC STYLES */
          #outlook a { padding:0; }
          body { width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0; }
          table, td { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
          img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
          p { display:block; margin:13px 0; }
  
          /* RESPONSIVE STYLES */
          @media only screen and (max-width:600px) {
            .container { width:100% !important; }
            .header, .content, .footer { padding:15px !important; }
            .button { width:100% !important; }
          }
  
          /* RESET STYLES */
          body, #bodyTable { background-color:#f4f4f4; }
          .container { width:600px; margin:0 auto; background-color:#ffffff; }
          .header { text-align:center; padding:20px; }
          .content { padding:20px; font-family: Arial, sans-serif; color:#333333; }
          .footer { text-align:center; padding:20px; font-size:12px; color:#777777; }
          .button { background-color:#yellow; color:#ffffff; padding:15px 25px; text-decoration:none; border-radius:5px; display:inline-block; }
          .button:hover { background-color:#218838; }
        </style>
      </head>
      <body>
        <table id="bodyTable" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table class="container" cellpadding="0" cellspacing="0">
                <!-- Header -->
                <tr>
                  <td class="header">
                    <img src="https://supplies.nrep.ug/images/NREP-WHITE.jpg" alt="NREP Logo" width="150" style="display:block; margin:0 auto;">
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td class="content">
                    <p>Dear ${supplierName},</p>
                    ${status === 'rejected' ? rejectionMessage : `<p>${comments}</p>`}
                    <p><strong>Procurement Title:</strong> ${procureTitle}</p>
                    <p><strong>Reference Number:</strong> ${procureRefNo}</p>
                    <p><strong>Application ID:</strong> ${applicationID}</p>
                    ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
                    <p style="text-align:center;">
                      <a href="https://supplies.nrep.ug/sign-in" class="button">View Your Application Status</a>
                    </p>
                    <p>If you have any questions, please contact our support team.</p>
                    ${disclaimer}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td class="footer">
                    <p>Best regards,<br>Procurement Department,<br>National Renewable Energy Platform (NREP)</p>
                    <p>&copy; ${currentYear} National Renewable Energy Platform (NREP). All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  
    const textDisclaimer = `
  This email and any attachments are intended solely for the use of the individual or entity to whom they are addressed and may contain confidential and privileged information. If you are not the intended recipient, please notify the sender immediately and delete this email from your system. Any unauthorized use, disclosure, or distribution is prohibited.
    `;
  
    const text = `
  Dear ${supplierName},
  
  We regret to inform you that your application has been rejected.
  
  Procurement Title: ${procureTitle}
  Reference Number: ${procureRefNo}
  Application ID: ${applicationID}
  
  ${comments ? `Comments: ${comments}` : ''}
  
  Please visit our portal to view your application status: https://supplies.nrep.ug/sign-in
  
  Best regards,
  Procurement Department,
  National Renewable Energy Platform (NREP)
  
  © ${currentYear} National Renewable Energy Platform (NREP). All rights reserved.
  
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
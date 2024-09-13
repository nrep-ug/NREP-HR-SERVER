import fs from 'fs';
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

// Function to save the password reset request to the JSON file
export const savePasswordResetRequest = async (userEmail, resetCode) => {
    const filePath = path.resolve('src/data/passwordReset.json');

    // Use moment-timezone to get the current date and time in the desired format
    const dateTime = moment().tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss'); // Adjust timezone as needed

    let existingRequests = [];
    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingRequests = fileContent ? JSON.parse(fileContent) : [];
    }

    const newRequest = {
        userEmail,
        code: resetCode,
        dateTime,
        isUsed: false,
    };

    existingRequests.push(newRequest);

    fs.writeFileSync(filePath, JSON.stringify(existingRequests, null, 2), 'utf8');
};
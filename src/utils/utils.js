// src/utils/utils.js
//---------------------------------
// Imports
//---------------------------------
import fs from 'fs/promises';        // Promise-based file system
import fsSync from 'fs';               // Synchronous file system
import path from 'path';
import moment from 'moment-timezone';

import nodemailer from 'nodemailer';
import postmark from 'postmark';

import pool from '../config/mysqlConfig.js';
import { InputFile } from 'node-appwrite/file';
import { storage, ID } from '../config/appwrite.js';

// Initialize Postmark client
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

//---------------------------------
// Date/Time Utilities
//---------------------------------
export const currentDateTime = moment().tz('Africa/Nairobi');

export const formatDate = () => {
    // Format the date as 'DD-MM-YYYY-HHmmss'
    return moment().tz('Africa/Nairobi').format('DD-MM-YYYY-HHmmss');
};

//---------------------------------
// File Upload & Management
//---------------------------------

// Upload file to Appwrite bucket
export const uploadFile = async (file, fileInfo, bucketId) => {
    const counterFilePath = path.resolve('./src/data/docID.json');
    const counterDir = path.dirname(counterFilePath);

    // Ensure the directory exists
    await fs.mkdir(counterDir, { recursive: true });
    let data;

    // Read or initialize the counter file
    try {
        data = await fs.readFile(counterFilePath, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            data = JSON.stringify({ documentID: 0 });
            await fs.writeFile(counterFilePath, data);
        } else {
            throw error;
        }
    }
    
    const counterData = JSON.parse(data);
    const counterKey = 'documentID';
    if (!counterData.hasOwnProperty(counterKey)) {
        counterData[counterKey] = 0;
    }
    counterData[counterKey] += 1;
    await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

    const currentDate = formatDate();
    const formattedCounter = String(counterData[counterKey]).padStart(4, '0');
    const uniqueId = `DOC-${currentDate}-${formattedCounter}`;

    console.log('Uploading file ... ', uniqueId);
    const response = await storage.createFile(
        bucketId,
        uniqueId,
        InputFile.fromBuffer(file, fileInfo.fileName)
    );
    console.log('Finished uploading file: ', fileInfo.fileName);

    return response;
};

// Upload a file to the MySQL database
export const uploadFile2 = async (file, fileInfo) => {
    try {
        const connection = await pool.getConnection();
        const { fileName, description } = fileInfo;
        const fileID = ID.unique();
        const sql = `
            INSERT INTO Files (fileId, name, description, file)
            VALUES (?, ?, ?, ?)
        `;
        const values = [fileID, fileName, description, file.buffer];
        await connection.execute(sql, values);
        connection.release();
        return fileID;
    } catch (error) {
        console.error('Error uploading file to the database:', error);
        throw error;
    }
};

// Appwrite File Preview
export const appwriteFileView = async (fileId, bucketId) => {
    // const result = await storage.getFileView(
    //     bucketId,
    //     fileId
    // )
    const result = await storage.getFileDownload(
        bucketId,
        fileId
    )

    return result;
};

// Delete a file from the Appwrite bucket
export const deleteAppwriteFile = async (bucketId, fileId) => {
    try {
        console.log('deleteAppwriteFile: ', bucketId, ' ---File to be deleted: ', fileId);
        const response = await storage.deleteFile(
            bucketId,
            fileId
        );
        console.log('File deleted: ', fileId, '--BucketId: ', bucketId);
        return response;
    }
    catch (err) {
        console.log('Failed to delete file: ', err);
        return
    }
}

// Retrieve a file from the MySQL database by fileId
export const getFileById = async (fileId) => {
    try {
        const connection = await pool.getConnection();

        // Query to retrieve the file data
        const [rows] = await connection.execute('SELECT * FROM Files WHERE fileId = ?', [fileId]);

        connection.release();

        if (rows.length === 0) {
            throw new Error('File not found');
        }

        const file = rows[0];
        return {
            fileName: file.name,
            description: file.description,
            fileData: file.file, // The BLOB data
            fileType: file.file_type // Assuming you have a file_type column for MIME type
        };
    } catch (error) {
        console.error('Error retrieving file from the database:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

//---------------------------------
// Code Verification & Helpers
//---------------------------------
export function isNrepUgEmail(email) {
    // Regular expression to match the domain nrep.ug and its subdomains
    const regex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*nrep\.ug$/;

    // Test the email against the regex
    return regex.test(email);
}

// Generate a random alphanumeric code of specified length
export const generateAplaNumericCode = async (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

// Verify a code from a given file (marks it as used upon successful verification)
export const verifyCode = async (fileName, expirationTimeInMinutes, userEmail, providedCode) => {
    const filePath = path.resolve(fileName);

    // Read the existing requests from the specified JSON file
    let existingRequests = [];
    if (fsSync.existsSync(filePath)) { // Use fsSync.existsSync
        const fileContent = await fs.readFile(filePath, 'utf8'); // Use fs.promises.readFile
        existingRequests = fileContent ? JSON.parse(fileContent) : [];
    }

    // Find the request matching the provided email and code
    const requestIndex = existingRequests.findIndex(
        (req) => req.userEmail === userEmail && req.code === providedCode
    );

    if (requestIndex === -1) {
        return false; // No matching request found
    }

    const request = existingRequests[requestIndex];

    // Check if the code has already been used
    if (request.isUsed) {
        return false; // The code has already been used
    }

    // Check if the code is expired
    const codeExpirationTime = moment(request.dateTime).add(expirationTimeInMinutes, 'minutes');
    const currentTime = moment().tz('Africa/Nairobi');

    if (currentTime.isAfter(codeExpirationTime)) {
        // Mark the code as expired
        existingRequests[requestIndex].isUsed = true;
        await fs.writeFile(filePath, JSON.stringify(existingRequests, null, 2), 'utf8'); // Use fs.promises.writeFile
        return false; // The code has expired
    }

    // Mark the code as used
    existingRequests[requestIndex].isUsed = true;
    await fs.writeFile(filePath, JSON.stringify(existingRequests, null, 2), 'utf8'); // Use fs.promises.writeFile

    // The code is valid and not expired
    return true;
};

// Helper function to check if a code (already marked as used) is still within valid time for password change
export const isCodeStillValid = async (fileName, expirationTimeInMinutes, userEmail, providedCode) => {
    const filePath = path.resolve(fileName);

    // Read the existing requests from the specified JSON file
    let existingRequests = [];
    if (fsSync.existsSync(filePath)) { // Use fsSync.existsSync
        const fileContent = await fs.readFile(filePath, 'utf8'); // Use fs.promises.readFile
        existingRequests = fileContent ? JSON.parse(fileContent) : [];
    }

    // Find the request matching the provided email and code
    const request = existingRequests.find(
        (req) => req.userEmail === userEmail && req.code === providedCode
    );

    if (!request) {
        return false; // No matching request found
    }

    // Check if the code was marked as used during initial verification
    if (!request.isUsed) {
        return false; // The code was not marked as used
    }

    // Check if the time validity of the code is still valid
    const codeExpirationTime = moment(request.dateTime).add(expirationTimeInMinutes, 'minutes');
    const currentTime = moment().tz('UTC');

    if (currentTime.isAfter(codeExpirationTime)) {
        return false; // The code is expired
    }

    // The code is still valid for the final step
    return true;
};

//---------------------------------
// Email Utilities
//---------------------------------
export const sendEmail = async ({
    to,
    subject,
    html,
    text,
    replyTo = null,
    department = null,
    cc = null,
    bcc = null,
  }) => {
    try {
      console.log('Type of cc:', typeof cc);
      console.log('Value of cc:', cc);
  
      // Ensure the 'From' email is verified with Postmark
      const verifiedFromEmail = process.env.POSTMARK_EMAIL_FROM; // Must be a verified email address
      const fromDisplayName = `${department ? `${department} Department - ` : ''}National Renewable Energy Platform (NREP)`;
      const from = `${fromDisplayName} <${verifiedFromEmail}>`;
  
      // Prepare email data for Postmark
      const emailData = {
        From: from,
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text,
        ReplyTo: replyTo || process.env.POSTMARK_EMAIL_REPLY_TO,
      };
  
      // Conditionally add CC field if it is provided and not empty
      if (cc) {
        if (Array.isArray(cc)) {
          if (cc.length > 0) {
            emailData.Cc = cc.join(', ');
          }
        } else if (typeof cc === 'string' && cc.trim()) {
          emailData.Cc = cc.trim();
        } else {
          console.warn('Invalid cc value:', cc);
        }
      }
  
      // Conditionally add BCC field if it is provided and not empty
      if (bcc) {
        if (Array.isArray(bcc)) {
          if (bcc.length > 0) {
            emailData.Bcc = bcc.join(', ');
          }
        } else if (typeof bcc === 'string' && bcc.trim()) {
          emailData.Bcc = bcc.trim();
        } else {
          console.warn('Invalid bcc value:', bcc);
        }
      }
  
      // Send the email using the Postmark client
      const response = await client.sendEmail(emailData);
  
      console.log('Email sent successfully:', response);
      return {
        success: true,
        messageId: response.MessageID,
      };
    } catch (error) {
      console.error('Error sending email:', error);
  
      // Postmark-specific error handling
      if (error.code === 400) {
        // Handle bad requests, such as invalid email addresses or unverified 'From' address
        throw new Error(`Postmark Error: ${error.message}`);
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  };  
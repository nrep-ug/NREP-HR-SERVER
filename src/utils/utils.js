// src/utils/utils.js
import fs from 'fs/promises'; // Use fs/promises for promise-based file system operations
import path from 'path';
import pool from '../config/mysqlConfig.js';
import moment from 'moment-timezone';
import { InputFile } from 'node-appwrite/file'
import {
    storage,
    ID,
    procurePostBucketId,
} from '../config/appwrite.js';
import fsSync from 'fs'; // Import the regular fs module for synchronous operations

// DATE/TIME
export const currentDateTime = moment().tz('Africa/Nairobi');

// DATE/TIME as `dd-mm-yyyy-hhmmss`
export const formatDate = () => {
    // Get the current date and time with moment-timezone
    const now = moment().tz('Africa/Nairobi'); // You can set your desired timezone instead of 'UTC'

    // Format the date in 'dd-mm-yyyy-hhmmss'
    return now.format('DD-MM-YYYY-HHmmss');
};

// Upload file to appwrite bucket
export const uploadFile = async (file, fileInfo, bucketId) => {

    /* GENERATING FILE-ID */
    const counterFilePath = path.resolve('./src/data/docID.json'); // Path to the counter file
    const counterDir = path.dirname(counterFilePath); // Directory path

    // Ensure the directory exists
    await fs.mkdir(counterDir, { recursive: true });

    let data;

    // Check if the file exists and read its content, or initialize the counter
    try {
        data = await fs.readFile(counterFilePath, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') { // If the file does not exist
            data = JSON.stringify({
                documentID: 0
            });
            await fs.writeFile(counterFilePath, data);
        } else {
            throw error; // Rethrow if another error occurred
        }
    }

    const counterData = JSON.parse(data);

    // Determine the key based on the type
    let counterKey = 'documentID';

    // Initialize the counter if the key doesn't exist
    if (!counterData.hasOwnProperty(counterKey)) {
        counterData[counterKey] = 0;
    }

    // Increment the relevant counter
    counterData[counterKey] += 1;

    // Save the updated counter back to the file
    await fs.writeFile(counterFilePath, JSON.stringify(counterData, null, 2));

    const currentDateTime = formatDate();
    const formattedCounter = String(counterData[counterKey]).padStart(4, '0');

    // Generate the unique ID in the format NREP-{TYPE}-YYYY-NNNN
    const uniqueId = `DOC-${currentDateTime}-${formattedCounter}`;

    /* SAVING DOCUMENT */
    console.log('Uploading file ... ', uniqueId)
    const response = await storage.createFile(
        bucketId,
        uniqueId,
        InputFile.fromBuffer(file, fileInfo.fileName)
    )
    console.log('Finished uploading file: ', fileInfo.fileName)

    return response;
};

// Upload a file to the MySQL database
export const uploadFile2 = async (file, fileInfo) => {
    // TODO: Add file-type as a field in the database table
    try {
        const connection = await pool.getConnection();

        const { fileName, description } = fileInfo;
        const fileID = ID.unique(); // Use a unique identifier for the file

        // Insert the file into the database
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
        throw error; // Re-throw the error to be handled by the caller
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

export function isNrepUgEmail(email) {
    // Regular expression to match the domain nrep.ug and its subdomains
    const regex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*nrep\.ug$/;

    // Test the email against the regex
    return regex.test(email);
}

// Function to generate a random 6-character code
export const generateAplaNumericCode = async (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

// Helper function to verify the code from a specific file
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

// Helper function to verify code time validity and is set to used. [ONLY USED AT PASSWORD CHANGE]
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
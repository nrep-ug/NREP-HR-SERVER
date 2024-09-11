// src/utils/utils.js
import { promises as fs } from 'fs';
import path from 'path';
import pool from '../config/mysqlConfig.js';
import moment from 'moment-timezone';
import { InputFile } from 'node-appwrite/file'
import {
    storage,
    ID,
    procurePostBucketId,
} from '../config/appwrite.js';

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
    const result = await storage.getFileView(
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

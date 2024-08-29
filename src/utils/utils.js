// src/utils/utils.js
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

// Upload file to appwrite bucket
export const uploadFile = async (file, fileInfo) => {
    console.log('Uploading file: ', fileInfo.fileName)
    const response = await storage.createFile(
        procurePostBucketId,
        ID.unique(),
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

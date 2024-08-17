import { databases } from '../config/appwrite.js';
import { hrDatabaseId, staffTableId } from '../config/appwrite.js';

export const createStaff = async (staffData) => {
    console.log('HR DB id: ', hrDatabaseId + '\n staff table id: ', staffTableId);
    console.log('Staff data: ', staffData);
    const response = await databases.createDocument(
        hrDatabaseId,
        staffTableId,
        'unique()',
        staffData
    );
    return response;
};

export const getStaff = async (staffId) => {
    const response = await databases.getDocument(
        hrDatabaseId,
        staffTableId,
        staffId
    );
    return response;
};
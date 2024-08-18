import { databases, ID, hrDatabaseId, staffTableId } from '../config/appwrite.js';

export const createStaff = async (staffData) => {
    console.log('HR DB id: ', hrDatabaseId + '\n staff table id: ', staffTableId);
    console.log('Staff data: ', staffData);
    const response = await databases.createDocument(
        hrDatabaseId,
        staffTableId,
        ID.unique(),
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

export const getAllStaff = async (query = []) => {
    console.log('gettin all staff')
    const response = await databases.listDocuments(
        hrDatabaseId,
        staffTableId,
        query
    );
    console.log('all staff: ', response);
    return response;
}
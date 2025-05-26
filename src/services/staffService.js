import { 
    databases, 
    ID, 
    hrDb
} from '../config/appwrite.js';

export const createStaff = async (staffData) => {
    console.log('HR DB id: ', hrDb.databaseId + '\n staff table id: ', hrDb.staffTableId);
    console.log('Staff data: ', hrDb.staffTableId);
    const response = await databases.createDocument(
        hrDb.databaseId,
        hrDb.staffTableId,
        ID.unique(),
        staffData
    );
    return response;
};

export const getStaff = async (staffId) => {
    const response = await databases.getDocument(
        hrDb.databaseId ,
        hrDb.staffTableId,
        staffId
    );
    return response;
};

export const getAllStaff = async (query = []) => {
    console.log('gettin all staff')
    const response = await databases.listDocuments(
        hrDb.databaseId ,
        hrDb.staffTableId,
        query
    );
    console.log('all staff: ', response);
    return response;
}
import {
    users,
    client,
    storage,
    databases,
    ID,
    Query,
    Permission,
    hrDb
} from "../../config/appwrite.js";

// ——— Delete User Account ———
export const deleteUserAccount = async (userId) => {
    try {
        // Delete user from Appwrite
        await users.delete(userId);
        
        // // Optionally, delete user data from HR database
        // await databases.deleteDocument(
        //     hrDb.databaseId,
        //     hrDb.staffTableId,
        //     userId
        // );

        return { success: true, message: 'User account deleted successfully.' };
    } catch (error) {
        console.error('Error deleting user account:', error);
        return { success: false, message: 'Failed to delete user account.' };
    }
};
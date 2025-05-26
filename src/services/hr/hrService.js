import { deleteUserAccount } from "../../utils/hr/utils.js";

// ——— Delete User Account Service ———
export const deleteUserAccountSerice = async (userId) => {
    console.log('Deleting user account: ', userId);
    const response = await deleteUserAccount(userId);
    if (response.success) {
        return { success: true, message: 'User account deleted successfully.' };
    } else {
        return { success: false, message: response.message || 'Failed to delete user account.' };
    }
};
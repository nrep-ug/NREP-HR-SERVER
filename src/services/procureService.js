/**
 * TODOs:
 *  - Set all the expirations at either midnight, or 18:00 from the client side
 *  - Create a function that checks and updates the post `status` every midnight hour after the expiration date
 */
import {
    databases,
    Query,
    ID,
    procureDatabaseId,
    procurePostsTableId,
    procureSupplierApplicationTableId,
    procureSupplierTableId,
    procureStaffTableId,
} from '../config/appwrite.js';
import { currentDateTime } from "../utils/utils.js";
import { generateUniqueId } from "../utils/procureUtils.js"
import bcrypt from 'bcrypt'; // Import bcrypt if using password hashing [WE'LL BE USING APPWRITE ENCRYPTION]

// Supplier Registration
export const signUp = async (data) => {
    let supplierData = { ...data }
    const createdAt = currentDateTime;
    const supplierID = await generateUniqueId('SR');

    // Encrypt the password
    const saltRounds = 10; // Number of salt rounds for hashing
    const hashedPassword = await bcrypt.hash(supplierData.password, saltRounds);

    // Replace the plain password with the hashed password
    supplierData.password = hashedPassword;

    // Register to Database table
    const response = await databases.createDocument(
        procureDatabaseId,
        procureSupplierTableId,
        supplierID,
        {
            ...supplierData,
            createdAt,
            supplierID,
            updatedAt: createdAt
        }
    )

    return response;
}

// Supplier sign-in
export const signIn = async (data) => {
    try {
        // Retrieve user by email
        const userData = await databases.listDocuments(
            procureDatabaseId,
            procureSupplierTableId, [
            Query.equal('email', data.email)
        ]);

        if (userData.documents.length !== 1) {
            return {
                status: false,
                message: 'No account found. Check your email or password and try again.'
            };
        }

        const user = userData.documents[0];

        // Assuming password is hashed, compare it with bcrypt
        const passwordMatch = await bcrypt.compare(data.password, user.password);

        if (!passwordMatch || data.email !== user.email) {
            return {
                status: false,
                message: 'Invalid password. Please try again.'
            };
        }

        // Successful sign-in
        return {
            status: true,
            success: true,
            message: 'Sign-in successful.',
            data: user
        };
    } catch (e) {
        console.log(e);
        return {
            success: false,
            status: false,
            message: `An error occurred. Please try again later or contact support: ${e}`,
            error: e.message
        };
    }
};

// Post or Add a service/product
export const addService = async (data) => {
    let serviceData = { ...data }
    const createdAt = currentDateTime
    const postID = await generateUniqueId('PS')

    const response = await databases.createDocument(procureDatabaseId, procurePostsTableId,
        postID,
        {
            serviceData,
            postID,
            createdAt,
            updatedAt: createdAt
        }
    )

    return { status: true, message: 'Service/Product post created successfully' };

}

// Return all VALID posted services/products
export const getAllServices = async (all = false, expired = false, status = null) => {
    let query = [Query.limit(100)];

    if (all) {
        // No additional query since we want all records
    } else if (expired) {
        query.push(Query.lessThan('deadline', currentDateTime));
    } else {
        query.push(Query.greaterThan('deadline', currentDateTime));
    }

    if (status !== null) {
        query.push(Query.equal('status', status));
    }

    const response = await databases.listDocuments(
        procureDatabaseId,
        procurePostsTableId,
        query
    );

    return response.documents;
};

// Return information about a specific posted service/product
export const getService = async (data) => {
    const response = await databases.getDocument(
        procureDatabaseId,
        procurePostsTableId,
        data.postID
    )

    return response
}

//Supplier Application for service/product supplying
export const applySupply = async (data) => {
    const applicationData = { ...data }
    const applicationID = await generateUniqueId('PR')
    const createdAt = currentDateTime()
    const updatedAt = currentDateTime()

    const response = await databases.createDocument(
        procureDatabaseId,
        procureSupplierApplicationTableId,
        {
            applicationData,
            applicationID,
            createdAt,
            updatedAt,
        }
    )

    return { status: true, message: 'Application submitted successfully' }
}

// Get Applied to services/products by Supplier
export const getAppliedToServices = async (supplierID) => {
    const response = await databases.listDocuments(
        procureDatabaseId,
        procureSupplierApplicationTableId,
        [
            Query.equal('supplierID', supplierID)
        ]
    )

    return response.documents
}

// Get Data to specific applied to services/products by Supplier
export const getAppliedToServiceData = async (data) => {
    const response = await databases.listDocuments(
        procureDatabaseId,
        procureSupplierApplicationTableId,
        [
            Query.equal('supplierID', data.supplierID),
            Query.equal('applicationID', data.applicationID)
        ]
    )

    return response.documents
}
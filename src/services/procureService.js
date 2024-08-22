import {
    databases, ID,
    procureDatabaseId,
    procurePostsTableId,
    procureSupplierApplicationTableId,
    procureSupplierTableId,
    procureStaffTableId,
} from '../config/appwrite.js';
import { currentDateTime } from "../utils/utils";
import { generateUniqueId } from "../utils/procureUtils.js"

// Supplier Registration
export const signUp = async (data) => {
    let supplierData = { ...data }
    const createdAt = currentDateTime
    const supplierID = await generateUniqueId('SR');

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

    return response
}

// Supplier sign-in
export const signIn = async (data) => {
    let userData;
    // get user password from database
    try {
        userData = await databases.listDocuments(databases, procureSupplierTableId, [
            Query.equal('supplierID', data.supplierID)
        ])
    } catch (e) {
        return ({ status: false, message: 'An error occured. Try agaian later or contact support for more help.', error: e });
    }

    if (userData.documents.length !== 1 || userData.documents[0].password !== data.password) {
        return ({ status: false, message: 'No account found. Check your email address or password and try again.' })
    }

    return ({ status: true, message: 'Account Exists.', data: userData.documents })
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

// Get Appliedt to services/products
export const getAppliedToServices = async (supplierID) => {
    const response = await databases.listDocuments(
        procureDatabaseId,
        procureSupplierApplicationTableId,
        [
            Query.equal('supplierID', supplierID)
        ]
    )
}
/**
 * TODOs:
 *  - Set all the expirations at either midnight, or 18:00 from the client side
 *  - Create a function that checks and updates the post `status` every midnight hour after the expiration date
 */
import {
    storage,
    databases,
    Query,
    ID,
    procureDatabaseId,
    procurePostsTableId,
    procureSupplierApplicationTableId,
    procureSupplierTableId,
    procureStaffTableId,
    procureCategoryTableId,
    hrDatabaseId,
    staffTableId
} from '../config/appwrite.js';
import { getStaff } from '../services/staffService.js'
import { currentDateTime, uploadFile, isNrepUgEmail } from "../utils/utils.js";
import { generateUniqueId } from "../utils/procureUtils.js"
import bcrypt from 'bcrypt'; // Import bcrypt if using password hashing [WE'LL BE USING APPWRITE ENCRYPTION]
import moment from 'moment-timezone';

/* STAFF SERVICES */

// Staff sign-up in Procurement module
export const signUpStaff = async (data) => {
    /**
     * - Receives the staff ID being added, Role of the user (e.g HR Manager, Assistant, Officer), userType (admin or staff)
     * - Account is then created and email is sent to notify user
     * - Staff logs in with the NREP system password
    **/

    let staffData = { ...data }
    console.log(staffData)

    const createdAt = currentDateTime;

    // Register to Procurement Database staff table
    const response = await databases.createDocument(
        procureDatabaseId,
        procureStaffTableId,
        staffData.staffID,
        {
            ...staffData,
            createdAt,
            updatedAt: createdAt
        }
    )

    // Send E-mail notification
    // TODO: send notification

    return response;
}

// Staff sign-in
// Staff sign-in function
export const signInStaff = async (data) => {
    /*
    * - Query HR Staff table for staff credentials
    * - Check Procurement Database if Staff Exists
    * - If ID does not exist, returns a failed login, or else returns a successful login with user data
    */
    try {
        console.log(data);

        // Determine the email field based on the email type
        const emailField = isNrepUgEmail(data.email) ? 'workEmail' : 'email1';

        // Query HR Staff table for staff credentials
        const hrResponse = await databases.listDocuments(
            hrDatabaseId,
            staffTableId,
            [Query.equal(emailField, data.email)]
        );

        if (hrResponse.documents.length !== 1) {
            return {
                status: false,
                message: 'No staff account found. Check your email or password and try again.'
            };
        }

        const userCredentials = {
            password: hrResponse.documents[0].password,
            staffID: hrResponse.documents[0].staffID
        };

        // Check Procurement Database if Staff Exists
        const procurementResponse = await databases.listDocuments(
            procureDatabaseId,
            procureStaffTableId,
            [Query.equal('staffID', userCredentials.staffID)]
        );

        if (procurementResponse.documents.length !== 1) {
            return {
                status: false,
                message: 'No account found in the Procurement Portal for Staff. Check your email or password and try again.'
            };
        }

        const userAccountData = hrResponse.documents[0]

        const user = procurementResponse.documents[0];

        // Check if the password matches
        if (userCredentials.password !== data.password) {
            console.log('Invalid credentials');
            return {
                status: false,
                message: 'Invalid password. Please try again.'
            };
        }

        console.log('Login successful');

        // Successful sign-in
        return {
            status: true,
            success: true,
            message: 'Sign-in successful.',
            data: {
                ...user,
                firstName: userAccountData.firstName,
                middleName: userAccountData.middleName,
                surName: userAccountData.surName
            }
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            status: false,
            message: `An error occurred. Please try again later or contact support: ${error.message}`,
            error: error.message
        };
    }
};


/* SUPPLIER SERVICES */

// Supplier Registration
export const signUpSupplier = async (data) => {
    const file = data.files
    let supplierData = { ...data.formData }
    console.log(supplierData)
    const createdAt = currentDateTime;
    const supplierID = await generateUniqueId('SR');

    // Encrypt the password
    const saltRounds = 10; // Number of salt rounds for hashing
    const hashedPassword = await bcrypt.hash(supplierData.password, saltRounds);

    // Replace the plain password with the hashed password
    supplierData.password = hashedPassword;

    let uploadedFile = null;
    if (file) {
        uploadedFile = await uploadFile(file.buffer, {
            fileName: file.originalname,
            mimeType: file.mimetype,
        });
    }

    // Register to Database table
    const response = await databases.createDocument(
        procureDatabaseId,
        procureSupplierTableId,
        supplierID,
        {
            ...supplierData,
            createdAt,
            supplierID,
            updatedAt: createdAt,
            userType: ['supplier'],
            document: [`SR-${uploadedFile.$id}`],
        }
    )

    return response;
}

// Supplier sign-in
export const signInSupplier = async (data) => {
    try {
        console.log(data);
        // Retrieve user by email
        const userData = await databases.listDocuments(
            procureDatabaseId,
            procureSupplierTableId, [
            Query.equal('accountEmail', data.email)
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
            console.log('Invalid credentials')
            return {
                status: false,
                message: 'Invalid password. Please try again.'
            };
        }

        console.log('Login successful');

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
export const createProcurementPost = async (formData, file) => {
    const createdAt = moment().tz('Africa/Nairobi');
    const postID = await generateUniqueId('PS');

    // Parse arrays from JSON strings (if passed as JSON strings)
    const deliverables = JSON.parse(formData.deliverables);
    const submissionRequirements = JSON.parse(formData.submissionRequirements);
    const evaluationCriteria = JSON.parse(formData.evaluationCriteria);
    const termsAndConditions = JSON.parse(formData.termsAndConditions);

    let uploadedFile = null;
    if (file) {
        uploadedFile = await uploadFile(file.buffer, {
            fileName: file.originalname,
            mimeType: file.mimetype,
        });
    }

    // Create the document in the Appwrite database
    const response = await databases.createDocument(
        procureDatabaseId,
        procurePostsTableId,
        postID,
        {
            title: formData.title,
            introduction: formData.introduction,
            description: formData.description,
            category: formData.category,
            deliverables,
            submissionRequirements,
            evaluationCriteria,
            termsAndConditions,
            issuanceDate: formData.issuanceDate,
            submissionDeadline: formData.submissionDeadline,
            questionsDeadline: formData.questionsDeadline,
            contractAwardDate: formData.contractAwardDate,
            createdBy: formData.createdBy,
            otherDocuments: uploadedFile ? [`PS-${uploadedFile.$id}`] : null,
            procureID: postID,
            createdAt,
            updatedAt: createdAt
        }
    );

    return response;
};

// Return all VALID posted services/products
export const getAllServices = async (all = false, expired = false, status = null) => {
    let query = [Query.limit(100)];

    if (all) {
        // No additional query since we want all records
    } else if (expired) {
        query.push(Query.lessThan('submissionDeadline', currentDateTime));
    } else {
        query.push(Query.greaterThan('submissionDeadline', currentDateTime));
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

// Return all valid posted services/products as paginations
export const getAllServicesPage = async (data) => {
    const limit = 8;
    const page = data.page;
    const offset = (page - 1) * limit;

    const documents = await databases.listDocuments(
        procureDatabaseId,
        procurePostsTableId, // Replace with your collection ID
        [
            Query.limit(limit),
            Query.offset(offset),
        ]
    );

    // Respond with the fetched documents and pagination info
    return ({
        documents: documents.documents,
        currentPage: page || 1,
        hasNextPage: documents.documents.length === limit,
        totalDocuments: documents.total, // Assuming the API provides total count
    });
};

// Return information about a specific posted service/product
export const getService = async (id) => {
    const response = await databases.getDocument(
        procureDatabaseId,
        procurePostsTableId,
        id
    )

    console.log('service: ', response);

    return response
}

//Supplier Application for service/product supplying
export const handleProcurementApplication = async (files) => {
    const incorporationCertificate = files['incorporationCertificate'][0];
    const teamCv = files['teamCv'][0];
    const budget = files['budget'][0];
    const otherDocument = files['otherDocument'][0];

    const uploadedIncorporationCertificate = await uploadFile(incorporationCertificate.buffer, {
        fileName: incorporationCertificate.originalname,
        mimeType: incorporationCertificate.mimetype,
    });

    const uploadedTeamCv = await uploadFile(teamCv.buffer, {
        fileName: teamCv.originalname,
        mimeType: teamCv.mimetype,
    });

    const uploadedBudget = await uploadFile(budget.buffer, {
        fileName: budget.originalname,
        mimeType: budget.mimetype,
    });

    const uploadedOtherDocument = await uploadFile(otherDocument.buffer, {
        fileName: otherDocument.originalname,
        mimeType: otherDocument.mimetype,
    });

    return {
        incorporationCertificate: uploadedIncorporationCertificate,
        teamCv: uploadedTeamCv,
        budget: uploadedBudget,
        otherDocument: uploadedOtherDocument,
    };
};

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

// Add or Create a new category
export const addCategory = async (data) => {
    // data format => {name:'', description:''|null, classification:[]|null}

    const catID = await generateUniqueId('CAT')

    const response = await databases.createDocument(
        procureDatabaseId,
        procureCategoryTableId,
        catID,
        {
            catID,
            data
        }
    )

    return response
};

// Return categories
export const getCategories = async () => {
    const response = await databases.listDocuments(
        procureDatabaseId,
        procureCategoryTableId
    )

    return response
}
/**
 * TODOs:
 *  - Set all the expirations at either midnight, or 18:00 from the client side
 *  - Create a function that checks and updates the post `status` every midnight hour after the expiration date
 */
import fs from 'fs';
import path from 'path';
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
    staffTableId,
    procurePostBucketId,
} from '../config/appwrite.js';
import { getStaff } from '../services/staffService.js'
import { currentDateTime, uploadFile, isNrepUgEmail, appwriteFileView, deleteAppwriteFile, generateAplaNumericCode, verifyCode, isCodeStillValid } from "../utils/utils.js";
import * as utils from "../utils/procureUtils.js"
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

// Staff sign-in service
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


/* ===== SUPPLIER SERVICES ===== */
/**
 * AUTH SERVICES
 */
// Supplier Registration
export const signUpSupplier = async (data) => {
    console.log('signing up supplier')
    const file = data.files;
    let supplierData = { ...data.formData };
    const createdAt = currentDateTime;
    const supplierID = await utils.generateUniqueId('SR');
    console.log('supplierID: ', supplierID);

    // Encrypt the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(supplierData.password, saltRounds);
    supplierData.password = hashedPassword;

    // Upload File if provided
    let uploadedFile = null;
    if (file !== undefined) {
        uploadedFile = await uploadFile(
            file.buffer,
            {
                fileName: file.originalname,
                mimeType: file.mimetype,
            },
            procurePostBucketId
        );
    }

    // Define the path to the JSON file
    const jsonFilePath = path.resolve('src/data/signup.json');

    // Read existing data from the JSON file
    let existingData = [];
    if (fs.existsSync(jsonFilePath)) {
        const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
        existingData = fileContent ? JSON.parse(fileContent) : [];
    }

    // Append the new supplier data
    const newSupplierEntry = {
        ...supplierData,
        createdAt,
        supplierID,
        updatedAt: createdAt,
        userType: ['supplier'],
        document: uploadedFile !== null ? [`${uploadedFile.$id}`] : [],
    };
    existingData.push(newSupplierEntry);

    // Write the updated data back to the JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(existingData, null, 2), 'utf8');

    // Register to the database
    let response
    try {
        response = await databases.createDocument(
            procureDatabaseId,
            procureSupplierTableId,
            supplierID,
            newSupplierEntry
        );
    } catch (e) {
        console.log('Error while signing up supplier: ',e);

        // Delete the uploaded file from the database if provided, otherwise
        console.log('Doc uploaded:', newSupplierEntry.document)
        if (newSupplierEntry.document.length > 0) {
            await deleteAppwriteFile(procurePostBucketId, newSupplierEntry.document[0])
        }

        console.log(e);
        if (e.type === 'document_already_exists') {
            console.log('error type: ', e.type)
            throw new Error('The company email or selected login email is already in use.')
        }
        else {
            throw new Error(`${e.type ? e.type : 'Failed to create account'}... ${e.message ? e.message : ''}`)
        }
    }

    return response;
};

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

        console.log('User Data: ', userData.documents);

        const user = userData.documents[0];

        // Assuming password is hashed, compare it with bcrypt
        const passwordMatch = await bcrypt.compare(data.password, user.password);

        if (!passwordMatch || data.email !== user.accountEmail) {
            console.log('Invalid credentials...' + 'PasspasswordMatch: ', passwordMatch, ' ... user email: ', user.accountEmail);
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

// Function to handle the password reset request
export const handlePasswordResetRequest = async (userEmail) => {
    console.log('Password reset request: ', userEmail);
    // Check if email exists
    const emailExists = await utils.checkEmailExists(userEmail);
    if (!emailExists.exist) {
        console.log('Email does not exist in the system.');
        throw new Error('Email does not exist');
    }

    // Generate the reset code
    const resetCode = await generateAplaNumericCode(6);

    // Prepare the email content
    const emailContent = utils.generateEmailContent(userEmail, resetCode);

    // Send the email
    const emailSent = await utils.sendPassResetEmail(userEmail, 'Password Reset Request', emailContent, 'help');

    if (emailSent) {
        console.log('Email sent successfully.');

        // Save the request to passwordReset.json
        utils.savePasswordResetRequest(userEmail, resetCode);
    }
};

// Function to handle code confirmationfor Password Reset
export const confirmPasswordResetCode = async (userEmail, providedCode) => {
    const fileName = 'src/data/passwordReset.json'; // Specify the file name
    const expirationTimeInMinutes = 30; // Set expiration time to 30 minutes

    // Call the helper function to verify the code
    const isCodeValid = await verifyCode(fileName, expirationTimeInMinutes, userEmail, providedCode);

    if (isCodeValid) {
        return { success: true, message: 'The code is valid and has been marked as used.' };
    } else {
        return { success: false, message: 'Invalid email, code, or the code has expired/been used.' };
    }
};

// Function to handle password change
export const handlePasswordChange = async (code, email, password) => {
    console.log('Setting new password for ', email);
    // Check if the code is valid and has been marked as used
    const fileName = 'src/data/passwordReset.json'; // Specify the file name
    const expirationTimeInMinutes = 30; // Set expiration time to 30 minutes

    const codeValid = await isCodeStillValid(fileName, expirationTimeInMinutes, email, code);

    if (!codeValid) {
        console.log('The code is no longer valid.'); // Inform the user
        throw new Error('Invalid, code, or the code has expired. Kindly request for another password reset');
    }

    console.log('Proceed to change the password.'); // Proceed with the password change

    // Check if email exists and only when the length of the documents is equal to 1
    const emailExists = await utils.checkEmailExists(email);
    if (!emailExists.exist) {
        console.log('Email does not exist in the system.');
        throw new Error('Email does not exist');
    }

    const supplierID = emailExists.data[0].$id

    // Encrypt the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Modify the password field with the new password
    const response = await databases.updateDocument(procureDatabaseId, procureSupplierTableId, supplierID, { password: hashedPassword })

    return { success: true, message: 'Password has been changed successfully', status: 200, data: response };
};

/*
*
*SERVICES TO RETURN SUPPLIERS AND RELATED INFORMATION
*/
// Return all suppliers services/products
export const getAllSuppliers = async (validated = null, userType = []) => {
    let query = [Query.limit(100)];

    if (validated===null) {
        // No additional query since we want all records
    } else if (validated) {
        query.push(Query.equal('validate', true));
    } else if(!validated){
        query.push(Query.equal('validate', false));
    }

    //TODO: Will implement the below later in the future
    if (userType.length === 1) {
        if (userType.includes('suppliers')) {
            query.push(Query.equal('userType', 'test'));
        }
        else if (userType.includes('test')) {
            query.push(Query.equal('userType', 'test'));
        }
    }

    const response = await databases.listDocuments(
        procureDatabaseId,
        procureSupplierTableId,
        query
    );

    return response.documents;
};

// Return all suppliers service function
export const getAllSuppliersPage = async (data) => {
    const limit = 8;
    const page = data.page;
    const offset = (page - 1) * limit;

    // Fetch the supplier documents
    const documents = await databases.listDocuments(
        procureDatabaseId,
        procureSupplierTableId,
        [
            Query.limit(limit),
            Query.offset(offset),
        ]
    );

    // Iterate over each supplier document to fetch the number of applications
    const suppliersWithApplications = await Promise.all(documents.documents.map(async (supplier) => {
        // Query the supplier application table to get the number of applications for this supplier
        const applicationResponse = await databases.listDocuments(
            procureDatabaseId,
            procureSupplierApplicationTableId,
            [
                Query.equal('supplierID', supplier.supplierID),
                Query.limit(50)
            ]
        );

        console.log(`Applications for ${supplier.supplierID}:/n`, applicationResponse)

        // Append the number of applications to the supplier object
        return {
            ...supplier,
            applications: applicationResponse.total // Add the total number of applications
        };
    }));

    // Respond with the fetched documents and pagination info
    return {
        documents: suppliersWithApplications,
        currentPage: page || 1,
        hasNextPage: documents.documents.length === limit,
        totalDocuments: documents.total,
    };
};

// Return information about a specific supplier
export const getSupplier = async (id) => {
    const response = await databases.getDocument(
        procureDatabaseId,
        procureSupplierTableId,
        id
    )

    // console.log('supplier: ', response);

    return response
}

/**
 * OTHER SERVICES
 */
// Post or Add a service/product
export const createProcurementPost = async (formData, file) => {
    const createdAt = moment().tz('Africa/Nairobi');
    const postID = await utils.generateUniqueId('PS');

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
            otherDocuments: uploadedFile ? [JSON.stringify(uploadedFile)] : null,
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

// SERVICE: Return all valid posted procurement opportunities as paginations
/**
 * RETURNS ONLY NONE-EXPIRED PROCUREMENT POSTS
 * @param {object}
 * @returns {object}
 */
export const getAllServicesPage = async (data) => {
    const limit = 8;
    const page = data.page || 1;
    const offset = (page - 1) * limit;

    const statuses = data.statuses ?? null;

    console.log('Statuses:', statuses);

    // Build query conditions
    const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.orderDesc('createdAt'), // Order by creation date
    ];

    if (statuses && Array.isArray(statuses) && statuses.length > 0) {
        queries.push(Query.equal('status', statuses));
    }

    const documents = await databases.listDocuments(
        procureDatabaseId,
        procurePostsTableId,
        queries
    );

    return {
        documents: documents.documents,
        currentPage: page,
        hasNextPage: documents.documents.length === limit,
        totalDocuments: documents.total,
    };
};


// Return information about a specific posted service/product
export const getService = async (id) => {
    const response = await databases.getDocument(
        procureDatabaseId,
        procurePostsTableId,
        id
    )

    // console.log('service: ', response);

    return response
}

//Supplier Application for service/product supplying
export const handleProcurementApplication = async (files, data) => {
    try {
        console.log('Procurement Application')
        console.log('Supplier ID: ', data.supplierID)
        // Check if the supplier has already applied for this procurement application
        console.log(`Checking if supplier (${data.supplierID}) already applied for ${data.procurementID}`);
        const ifApplied = await databases.listDocuments(
            procureDatabaseId,
            procureSupplierApplicationTableId,
            [
                Query.equal('supplierID', data.supplierID),
                Query.equal('postID', data.procurementID),
            ]
        );

        if (ifApplied.documents.length > 0) {
            console.log('Supplier already applied');
            return {
                status: 409,
                message: `Already applied for this procurement (REF.No.: ${data.procurementID}).`,
            };
        }

        // Function to upload a file
        const uploadFileHandler = async (file) => {
            if (!file) return null; // Check if the file exists
            return await uploadFile(
                file.buffer,
                {
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                },
                procurePostBucketId
            );
        };

        // Proceed with file uploads if not already applied
        console.log('Not yet applied. Proceeding to apply');

        const filesToUpload = [
            { key: 'incorporationCertificate', required: true },
            { key: 'teamCv', required: true },
            { key: 'teamCv2', required: false },
            { key: 'budget', required: false },
            { key: 'otherDocument', required: false },
        ];

        let allFiles = [];

        // Iterate over the files and upload them if they exist
        for (const { key, required } of filesToUpload) {
            const file = files[key] ? files[key][0] : null;
            if (file || !required) {
                const uploadedFile = await uploadFileHandler(file);
                if (uploadedFile) {
                    allFiles.push(JSON.stringify(uploadedFile));
                }
            } else {
                return {
                    status: 400,
                    message: `${key} is required and was not provided.`,
                };
            }
        }

        console.log('All files uploaded: ', allFiles);

        // Save to Supplier Application Table
        const createdAt = currentDateTime;
        const applicationID = await utils.generateUniqueId('PR');

       console.log('proceeding to finish application') 
        const response = await databases.createDocument(
            procureDatabaseId,
            procureSupplierApplicationTableId,
            applicationID,
            {
                applicationID,
                postID: data.procurementID,
                supplierID: data.supplierID,
                submittedDocuments: allFiles,
                createdAt,
                updatedAt: createdAt,
            }
        );

        console.log('Successfully Applied for the procurement: ', response);

        return {
            status: 200,
            message: 'Application submitted successfully',
            data: response,
        };
    } catch (error) {
        console.error('Error during application submission: ', error);
        throw new Error({
            status: 500,
            message: 'An error occurred during the application submission.',
        }) ;
    }
};

// Get Applied to services/products by Supplier
export const getAppliedToServices = async (supplierID) => {
    console.log('getting applied to services/products', supplierID);
    const response = await databases.listDocuments(
        procureDatabaseId,
        procureSupplierApplicationTableId,
        [
            Query.equal('supplierID', supplierID)
        ]
    )

    console.log(response);

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

    const catID = await utils.generateUniqueId('CAT')

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

//File View
export const getFileView = async (fileId) => {
    console.log('Getting file to view', fileId)
    const response = await appwriteFileView(fileId, procurePostBucketId)
    return response
}
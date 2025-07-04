// src/controllers/procureController.js
import { validationResult } from 'express-validator';
import * as procureService from '../services/procureService.js';

// Register Service Provider
export const signUpStaff = async (req, res, next) => {
    try {
        // Validate the input if necessary
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log('staffData: ', req.body)

        const createAccount = await procureService.signUpStaff(req.body);

        res.status(201).json({
            message: 'Staff Account Created successfully!',
        });
    } catch (error) {
        next(error);
    }
};

// Register Service Provider
export const signUpSupplier = async (req, res, next) => {
    try {
        // Validate the input if necessary
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Error at controller - supplier registration: ', errors)
            return res.status(400).json({ errors: errors.array() });
        }

        // Log the incoming data to verify
        console.log('Data: ', req.body); // Should show the form fields
        // console.log('File: ', req.file);  // Should show the file information

        // Proceed with your service or business logic
        const createAccount = await procureService.signUpSupplier({ formData: req.body, files: req.file });

        res.status(201).json({
            message: 'Supplier Account Created successfully!',
        });
    } catch (error) {
        next(error);
    }
};

// Sign in Provider
export const signIn = async (req, res, next) => {
    try {
        // Validate incoming request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Call the signIn service with the request body
        let result
        if (req.body.userType.includes('supplier')) {
            result = await procureService.signInSupplier(req.body);
        }
        else if (req.body.userType.includes('staff')) {
            result = await procureService.signInStaff(req.body);
        }

        if (!result.status) {
            return res.status(401).json({ message: result.message });
        }

        // Return success response with user data
        res.status(200).json({
            success: result.success !== undefined ? result.success : false,
            message: result.message,
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

// Password Reset
export const handlePasswordResetRequest = async (req, res, next) => {
    try {
        console.log('handlePasswordResetRequest invoked');
        // Validate the input if necessary
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'An error occured.', errors: errors.array() });
        }

        console.log('Email to reset: ', req.body)

        const resetPassword = await procureService.handlePasswordResetRequest(req.body.email);

        res.status(201).json({
            success: true,
            message: `A password reset code has been sent to your email (${req.body.email}).`,
        });
    } catch (error) {
        next(error);
    }
};

// Password code reset confirmation
export const confirmPasswordResetCode = async (req, res, next) => {
    try {
        console.log('Confirming Password Reset Code: ', req.body)
        const response = await procureService.confirmPasswordResetCode(req.body.email, req.body.code);
        if (!response.success) {
            return res.status(404).json(response);
        }
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

// Handle Password Modification/Change with new password
export const handlePasswordChange = async (req, res, next) => {
    try {

        // Validate the input if necessary
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        console.log('Changing supplier password ... ', req.body)
        const response = await procureService.handlePasswordChange(req.body.code, req.body.email, req.body.newPassword)
        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

// Get a service
export const getService = async (req, res, next) => {
    try {
        console.log('Getting procure service: ', req.params)
        const proocure = await procureService.getService(req.params.procureID);
        if (!proocure) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(proocure);
    } catch (error) {
        next(error);
    }
};

// Post/Add New Service
export const createProcurementPost = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const createdPost = await procureService.createProcurementPost(req.body, req.file);

        res.status(201).json({
            message: 'Procurement post successfully created!',
            data: createdPost,
        });
    } catch (error) {
        next(error);
    }
};

// Return valid or non-expired services
export const getAllServices = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Destructure and set default values
        const { all = false, expired = false, status = null } = req.query;

        // Convert 'all' and 'expired' from string to boolean and pass to the service
        const procure = await procureService.getAllServices(
            all === 'true',       // 'true' string becomes true, others become false
            expired === 'true',   // 'true' string becomes true, others become false
            status                // Pass status as it is (string or null)
        );

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

// Return valid or non-expired services by pagination
export const getAllServicesPage = async (req, res, next) => {
    try {
        const errors = validationResult(req); // Assuming you use express-validator
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let { page, statuses } = req.query;

        // Ensure `statuses` is an array
        if (statuses) {
            if (Array.isArray(statuses)) {
                // statuses is already an array
                statuses = statuses;
            } else if (typeof statuses === 'string') {
                // statuses is a single value, convert it to an array
                statuses = [statuses];
            } else {
                // Invalid format
                statuses = null;
            }
        } else {
            statuses = null;
        }

        // Optional: Validate statuses
        if (statuses && Array.isArray(statuses)) {
            const validStatuses = ['active', 'pending', 'closed'];
            const invalidStatuses = statuses.filter((status) => !validStatuses.includes(status));

            if (invalidStatuses.length > 0) {
                return res.status(400).json({ error: `Invalid status values: ${invalidStatuses.join(', ')}` });
            }
        }

        const procure = await procureService.getAllServicesPage({ page, statuses });

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

// Return suppliers
export const getAllSuppliers = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log('Fetching suppliers: ', req.query)

        // Destructure and set default values
        const { validated = null, userType = [] } = req.query;

        // Convert 'validated' from string to boolean and pass to the service
        const procure = await procureService.getAllSuppliers(
            supplierValidated = validated === 'true' ? true : validated===null ? null : false,       // 'true' string becomes true, others become false
            userType,
        );

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

// Return valid or non-expired services by pagination
export const getAllSuppliersPage = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { page, status } = req.query;

        const procure = await procureService.getAllSuppliersPage({ page, status })

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

// Get a supplier
export const getSupplier = async (req, res, next) => {
    try {
        console.log('Getting supplier information: ', req.params)
        const supplier = await procureService.getSupplier(req.params.supplierID);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.status(200).json(supplier);
    } catch (error) {
        next(error);
    }
};

//TODO: Implement creation of a category
// Return categories
export const getCategories = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const procure = await procureService.getCategories()

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

// Apply for Procurement
export const applyForProcurement = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const apply = await procureService.handleProcurementApplication(req.files, req.body);

        apply.status === 200 ?  res.status(200).json(apply):res.status(409).json(apply) ;

    } catch (error) {
        next(error);
    }
};

// Get applied to procurement services
export const getAppliedToServices = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const procure = await procureService.getAppliedToServices(req.query.supplierID)

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

export const getAppliedToServiceData = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const procure = await procureService.getAppliedToServiceData(req.query.supplierID, req.query.serviceID)

        res.status(200).json(procure);

    } catch (error) {
        next(error);
    }
};

// Controller function to update application status
export const updateApplicationStatus = async (req, res, next) => {
    try {
        // Validate incoming request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { applicationID } = req.params;
        const { status, comments } = req.body;

        // Call the service function to update the application status
        const updatedApplication = await procureService.updateApplicationStatusInDB(applicationID, status, comments);

        res.status(200).json({
            success: true,
            message: 'Application status updated successfully.',
            data: updatedApplication,
        });
    } catch (error) {
        console.error('Error in updateApplicationStatus controller:', error);
        next(error);
    }
};

// File View
export const viewFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const arrayBuffer = await procureService.getFileView(fileId);

        // Set the content type according to the file type
        res.setHeader('Content-Type', 'application/pdf'); // Example: application/pdf, image/png, etc.
        res.setHeader('Content-Length', arrayBuffer.byteLength);
        res.setHeader('Content-Disposition', `inline; filename="${fileId}.pdf"`); // Adjust filename and type as necessary

        // Send the ArrayBuffer as the response body
        res.send(Buffer.from(arrayBuffer));
    } catch (error) {
        console.error('Error fetching file view:', error);
        res.status(500).json({ message: 'Failed to fetch the document' });
    }
};
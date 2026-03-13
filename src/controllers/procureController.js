// src/controllers/procureController.js
import { validationResult } from 'express-validator';
import * as procureService from '../services/procureService.js';

// Register Staff Account
export const signUpStaff = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('staffData: ', req.body);
    await procureService.signUpStaff(req.body);
    res.status(201).json({ message: 'Staff Account Created successfully!' });
};

// Register Service Provider (Supplier)
export const signUpSupplier = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Error at controller - supplier registration: ', errors);
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('Data: ', req.body);
    await procureService.signUpSupplier({ formData: req.body, files: req.file });
    res.status(201).json({ message: 'Supplier Account Created successfully!' });
};

// Sign in Provider
export const signIn = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let result;
    if (req.body.userType.includes('supplier')) {
        result = await procureService.signInSupplier(req.body);
    } else if (req.body.userType.includes('staff')) {
        result = await procureService.signInStaff(req.body);
    }

    if (!result.status) {
        return res.status(401).json({ message: result.message });
    }

    res.status(200).json({
        success: result.success !== undefined ? result.success : false,
        message: result.message,
        data: result.data,
    });
};

// Password Reset Request
export const handlePasswordResetRequest = async (req, res) => {
    console.log('handlePasswordResetRequest invoked');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'An error occured.', errors: errors.array() });
    }

    console.log('Email to reset: ', req.body);
    await procureService.handlePasswordResetRequest(req.body.email);
    res.status(201).json({
        success: true,
        message: `A password reset code has been sent to your email (${req.body.email}).`,
    });
};

// Password Reset Code Confirmation
export const confirmPasswordResetCode = async (req, res) => {
    console.log('Confirming Password Reset Code: ', req.body);
    const response = await procureService.confirmPasswordResetCode(req.body.email, req.body.code);
    if (!response.success) {
        return res.status(404).json(response);
    }
    res.status(200).json(response);
};

// Password Change
export const handlePasswordChange = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('Changing supplier password ... ', req.body);
    const response = await procureService.handlePasswordChange(req.body.code, req.body.email, req.body.newPassword);
    res.status(200).json(response);
};

// Get a single service
export const getService = async (req, res) => {
    console.log('Getting procure service: ', req.params);
    const procure = await procureService.getService(req.params.procureID);
    if (!procure) {
        return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(procure);
};

// Post / Add New Service
export const createProcurementPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const createdPost = await procureService.createProcurementPost(req.body, req.file);
    res.status(201).json({
        message: 'Procurement post successfully created!',
        data: createdPost,
    });
};

// Return valid / non-expired services
export const getAllServices = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { all = false, expired = false, status = null } = req.query;
    const procure = await procureService.getAllServices(
        all === 'true',
        expired === 'true',
        status,
    );
    res.status(200).json(procure);
};

// Return services by pagination
export const getAllServicesPage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { page, statuses } = req.query;

    if (statuses) {
        if (Array.isArray(statuses)) {
            // already an array
        } else if (typeof statuses === 'string') {
            statuses = [statuses];
        } else {
            statuses = null;
        }
    } else {
        statuses = null;
    }

    if (statuses && Array.isArray(statuses)) {
        const validStatuses = ['active', 'pending', 'closed'];
        const invalidStatuses = statuses.filter(s => !validStatuses.includes(s));
        if (invalidStatuses.length > 0) {
            return res.status(400).json({ error: `Invalid status values: ${invalidStatuses.join(', ')}` });
        }
    }

    const procure = await procureService.getAllServicesPage({ page, statuses });
    res.status(200).json(procure);
};

// Return suppliers
export const getAllSuppliers = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('Fetching suppliers: ', req.query);
    const { validated = null, userType = [] } = req.query;
    const supplierValidated = validated === 'true' ? true : validated === null ? null : false;
    const procure = await procureService.getAllSuppliers(supplierValidated, userType);
    res.status(200).json(procure);
};

// Return suppliers by pagination
export const getAllSuppliersPage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { page, status } = req.query;
    const procure = await procureService.getAllSuppliersPage({ page, status });
    res.status(200).json(procure);
};

// Get a single supplier
export const getSupplier = async (req, res) => {
    console.log('Getting supplier information: ', req.params);
    const supplier = await procureService.getSupplier(req.params.supplierID);
    if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(200).json(supplier);
};

// Return categories
export const getCategories = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const procure = await procureService.getCategories();
    res.status(200).json(procure);
};

// Apply for Procurement
export const applyForProcurement = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const apply = await procureService.handleProcurementApplication(req.files, req.body);
    apply.status === 200 ? res.status(200).json(apply) : res.status(409).json(apply);
};

// Get applied-to services
export const getAppliedToServices = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('getting applied to services/products', req.query.supplierID);
    const procure = await procureService.getAppliedToServices(req.query.supplierID);
    res.status(200).json(procure);
};

export const getAppliedToServiceData = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const procure = await procureService.getAppliedToServiceData(req.query.supplierID, req.query.serviceID);
    res.status(200).json(procure);
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { applicationID } = req.params;
    const { status, comments } = req.body;
    const updatedApplication = await procureService.updateApplicationStatusInDB(applicationID, status, comments);

    res.status(200).json({
        success: true,
        message: 'Application status updated successfully.',
        data: updatedApplication,
    });
};

// File View
export const viewFile = async (req, res) => {
    const { fileId } = req.params;
    const arrayBuffer = await procureService.getFileView(fileId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', arrayBuffer.byteLength);
    res.setHeader('Content-Disposition', `inline; filename="${fileId}.pdf"`);
    res.send(Buffer.from(arrayBuffer));
};
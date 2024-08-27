import multer from 'multer';
import { configureMulter } from '../config/multerConfig.js'
import { validationResult } from 'express-validator';
import * as procureService from '../services/procureService.js';

// Rewgister Service Provider
export const signUp = async (req, res, next) => {
    try {
        // Validate the input if necessary
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Log the incoming data to verify
        console.log('Data: ', req.body); // Should show the form fields
        console.log('File: ', req.file);  // Should show the file information

        // Proceed with your service or business logic
        const createAccount = await procureService.signUp({ formData: req.body, files: req.file });

        res.status(201).json({
            message: 'Account Created successfully!',
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
        const result = await procureService.signIn(req.body);

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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { page } = req.query;

        const procure = await procureService.getAllServicesPage({ page })

        res.status(200).json(procure);

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

        const uploadedFiles = await procureService.handleProcurementApplication(req.files);

        res.status(200).json({
            message: 'Application submitted successfully!',
            procurementId: req.body.procurementId,
            files: uploadedFiles,
        });
    } catch (error) {
        next(error);
    }
};
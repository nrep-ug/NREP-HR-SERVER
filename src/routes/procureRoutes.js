// src\routes\procureRoutes.js
import express from 'express';
import {
    getAllServices,
    signUp,
    signIn,
    // addService,
    createProcurementPost,
    getCategories,
    getService,
    getAllServicesPage,
    applyForProcurement,
} from '../controllers/procureController.js';
import {
    validateSignIn,
    validateGetAllServices,
    validateSupplier,
    validateProcurementApplication,
} from '../validations/procureValidation.js';

import upload from '../config/multerConfig2.js'; // Import multer configuration

const router = express.Router();

router.post('/supplier-register', upload.single('documents'), validateSupplier, signUp);
router.post('/sign-in', validateSignIn, signIn);
router.post(
    '/add-service',
    upload.single('otherDocuments'), // Handle single file upload
    createProcurementPost
); // Validation to be created
router.get('/get-service/:procureID', getService);
router.get('/services', validateGetAllServices, getAllServices);
router.get('/serivces/pages', getAllServicesPage); // Returns paginated list of services

router.post(
    '/apply',
    upload.fields([
        { name: 'incorporationCertificate', maxCount: 1 },
        { name: 'teamCv', maxCount: 1 },
        { name: 'budget', maxCount: 1 },
        { name: 'otherDocument', maxCount: 1 },
    ]),
    validateProcurementApplication,
    applyForProcurement
);

// TODO: Implement creation of a category
router.get('/get-categories', getCategories);

export default router;

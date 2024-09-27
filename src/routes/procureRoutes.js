// src\routes\procureRoutes.js
import express from 'express';
import {
    signUpStaff,
    getAllServices,
    signUpSupplier,
    signIn,
    getAllSuppliers,
    getAllSuppliersPage,
    handlePasswordResetRequest,
    confirmPasswordResetCode,
    handlePasswordChange,
    // addService,
    createProcurementPost,
    getCategories,
    getService,
    getAllServicesPage,
    applyForProcurement,
    getAppliedToServices,
    getAppliedToServiceData,
    viewFile
} from '../controllers/procureController.js';
import {
    validateSignIn,
    validateGetAllServices,
    validateGetAllSuppliers,
    validateSupplier,
    validateProcurementApplication,
} from '../validations/procureValidation.js';

import upload from '../config/multerConfig2.js'; // Import multer configuration

const router = express.Router();

// Authentication routes
router.post('/staff-register', signUpStaff) // To implement validateStaff
router.post('/supplier-register', upload.single('documents'), validateSupplier, signUpSupplier);
router.post('/sign-in', validateSignIn, signIn);
router.post('/request-password-reset', handlePasswordResetRequest) // To implement validatePasswordResetEmail
router.post('/validate-otp-password-reset', confirmPasswordResetCode)
router.post('/set-new-password', handlePasswordChange)

//Supplier related routes
router.get('/suppliers', validateGetAllSuppliers, getAllSuppliers);
router.get('/suppliers/pages', getAllSuppliersPage); // Returns paginated list of services

// Other routes
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
        { name: 'teamCv2', maxCount: 1 },
        { name: 'budget', maxCount: 1 },
        { name: 'otherDocument', maxCount: 1 },
    ]),
    validateProcurementApplication,
    applyForProcurement
);

router.get('/applied', getAppliedToServices);
router.get('/applied/service-details', getAppliedToServiceData);

router.get('/document/view/:fileId', viewFile)

// TODO: Implement creation of a category
router.get('/get-categories', getCategories);

export default router;

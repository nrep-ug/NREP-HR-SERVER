import express from 'express';
import { getAllServices, signUp, signIn } from '../controllers/procureController.js';
import { validateSignIn, validateGetAllServices, validateSupplier } from '../validations/procureValidation.js';

const router = express.Router();

router.post('/provider-signup/', validateSupplier, signUp);
router.post('/sign-in', validateSignIn, signIn);
router.get('/services', validateGetAllServices, getAllServices);

export default router;

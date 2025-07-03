import express from 'express';
import { validateRegConfirmation } from '../validations/recValidation.js';
import {sendRegConfirmationEmail} from '../controllers/recController.js';

const router = express.Router();

// Routes for Renewable Energy Conference (REC)
router.post('/send-reg-confirmation-email', validateRegConfirmation, sendRegConfirmationEmail);

export default router;
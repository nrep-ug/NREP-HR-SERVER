import express from 'express';
import {validateSendStaffEmail} from '../validations/generalValidation.js';
import { sendStaffEmail } from '../controllers/generalController.js';

const router = express.Router();

// Route to send email
router.post('/send-email', validateSendStaffEmail, sendStaffEmail);

export default router;
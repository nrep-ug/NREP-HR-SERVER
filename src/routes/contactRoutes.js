// src/routes/contactRoutes.js
import express from 'express';
import { handleContactForm } from '../controllers/contactController.js';
import { validateContactForm } from '../validations/contactValidation.js';

const router = express.Router();

router.post('/contact', validateContactForm, handleContactForm);

export default router;

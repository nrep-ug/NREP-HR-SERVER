// src/routes/procureRoutes.js

import express from 'express';
import {generateUniqueCode} from '../controllers/codeGenController.js';
import {codeGenValidation} from '../validations/codeGenValidation.js';

const router = express.Router();

// Route to generate unique code
router.post('/generate-code', codeGenValidation, generateUniqueCode);

export default router;
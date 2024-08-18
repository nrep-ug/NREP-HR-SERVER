import express from 'express';
import { createStaff, getStaff, getAllStaff } from '../controllers/staffController.js';
import { createStaff as createStaffValidation } from '../validations/staffValidation.js';

const router = express.Router();

router.post('/', createStaffValidation, createStaff);
router.get('/all-staff', getAllStaff);
router.get('/:id', getStaff);

export default router;
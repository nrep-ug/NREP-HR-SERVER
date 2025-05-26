import express from 'express';
import {deleteUserAccount} from '../controllers/hrController.js';
import {validateDeleteUserAccount} from '../validations/hrValidation.js';

const	router = express.Router();

// HR routes
router.delete('/delete-user-account/:id', validateDeleteUserAccount, deleteUserAccount);

export default router;
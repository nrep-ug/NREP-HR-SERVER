import express from 'express';
import { userSignin } from '../controllers/authController.js';
import { userSignin as userSigninValidation } from '../validations/authValidation.js';

const router = express.Router();

router.post('/signin', userSigninValidation, userSignin);

export default router;
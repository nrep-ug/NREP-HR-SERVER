import express from 'express';
import { userSignin, requestOTP } from '../controllers/authController.js';
import { userSignin as userSigninValidation, requestOTP as userOtpRequest } from '../validations/authValidation.js';

const router = express.Router();

router.post('/signin', userSigninValidation, userSignin);
router.post('/request-otp', userOtpRequest, requestOTP);

export default router;
import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';

export const userSignin = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const project = await authService.userSignin(req.body);
    console.log('logged in: ', project);
    res.status(201).json(project);
};

export const requestOTP = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const otp = await authService.requestOTP(req.body);
    console.log('OTP requested: ', otp);
    res.status(201).json(otp);
};
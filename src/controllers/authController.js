import { validationResult } from 'express-validator';
import * as authService from '../services/authService.js';

export const userSignin = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const project = await authService.userSignin(req.body);
        console.log('logged in: ', project)
        res.status(201).json(project);
    } catch (error) {
        console.log('failed to login: ',error)
        next(error);
    }
};

export const requestOTP = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const otp = await authService.requestOTP(req.body);
        console.log('OTP requested: ', otp)
        res.status(201).json(otp);
    } catch (error) {
        console.log('failed to request OTP: ',error)
        next(error);
    }
};
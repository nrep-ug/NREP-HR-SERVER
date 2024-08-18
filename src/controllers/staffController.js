import { validationResult } from 'express-validator';
import * as staffService from '../services/staffService.js';

export const createStaff = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const staff = await staffService.createStaff(req.body);
        res.status(201).json(staff);
    } catch (error) {
        next(error);
    }
};

export const getStaff = async (req, res, next) => {
    try {
        const staff = await staffService.getStaff(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }
        res.status(200).json(staff);
    } catch (error) {
        next(error);
    }
};

export const getAllStaff = async (req, res, next) => {
    try {
        const staffs = await staffService.getAllStaff(req.params.query);
        if (!staffs) {
            return res.status(404).json({ message: 'Staffs not found' });
        }
        res.status(200).json(staffs);
    } catch (error) {
        next(error);
    }
}
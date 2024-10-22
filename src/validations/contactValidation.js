// src/validations/contactValidation.js
import { body } from 'express-validator';

export const validateContactForm = [
    body('name')
        .notEmpty()
        .withMessage('Name is required.')
        .isString()
        .trim()
        .escape(),
    body('email')
        .notEmpty()
        .withMessage('Email is required.')
        .isEmail()
        .withMessage('Email is invalid.')
        .normalizeEmail(),
    body('subject')
        .notEmpty()
        .withMessage('Subject is required.')
        .isString()
        .trim()
        .escape(),
    body('message')
        .notEmpty()
        .withMessage('Message is required.')
        .isString()
        .trim()
        .escape(),
    body('from')
        .notEmpty()
        .withMessage('Portal name is required.')
        .isString()
        .trim()
        .escape(),
];

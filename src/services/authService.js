import { databases, hrDb, ID } from '../config/appwrite.js';
import { sendEmail, isNrepUgEmail, getCurrentDateTime } from '../utils/utils.js';
import { randomInt } from 'node:crypto';

// TODO: Real user sign-in functionality using proper authentication (e.g., JWT + Appwrite auth)
// The hardcoded credentials have been removed. This endpoint must be implemented with proper auth.
export const userSignin = async (data) => {
    // Placeholder – returns failure until real auth is wired up
    return { success: false, message: 'Sign-in not yet implemented. Please contact the system administrator.' };
}; //TODO: Real login functionality to be implemented

// OTP Request
export const requestOTP = async (data) => {
    const { email } = data;
    
    const otpId = `OTP-EM-${ID.unique()}`; // Generate a unique ID for the OTP document

    //Function to save OTP details to database
    const saveOtpToDatabase = async (email, otp, emailSent) => {
        try {
            const response = await databases.createDocument(
                hrDb.databaseId,
                hrDb.otpRequestTableId,
                otpId,
                {
                    otpId: otpId,
                    email: email,
                    otp: `${otp}`,
                    emailSent: emailSent,
                    validTime: data.timeValidity,
                    creationDate: getCurrentDateTime(),
                }
            );
            return response;
        } catch (error) {
            console.error('Error saving OTP to database:', error);
            return null;
        }
    }
    
    const isValidEmail = isNrepUgEmail(email);
    if (!isValidEmail) {
        return { success: false, message: 'Invalid email address' };
    }

    // Generate a cryptographically secure 6-digit OTP
    const otp = randomInt(100000, 1000000);

    const subject = 'Your OTP Code';
    //Calculate the time validity destructured from data for the OTP, if the passed minutes are greater than 60 minutes, set in hours and minutes, if greater than 24 hours, set in days and hours and hours and minutes
    const timeValidityString = data.timeValidity > 60 ? `${Math.floor(data.timeValidity / 60)} hours and ${data.timeValidity % 60} minutes` : `${data.timeValidity} minutes`;
    const message = `Your OTP code is ${otp}. It is valid for ${timeValidityString}.`;
    // send emailEmail paramaeters it takes are to,subject,html,text,
    const sendEmailResponse = await sendEmail({
        to: email,
        subject: subject,
        html: `<p>${message}</p>`,
        text: message,
    });
    if (sendEmailResponse.success) {
        const emailSent = sendEmailResponse.success;
        const saveResponse = await saveOtpToDatabase(email, otp, emailSent);
        if (!saveResponse) {
            return { success: false, message: 'Failed to save OTP to database' };
        }
        // Otp token shouldn't be sent back to the client for security reasons
        return { success: true, message: 'OTP sent successfully', otpId: otpId };
    } else {
        console.error('Error sending OTP email.');
        // Handle email sending error
        // Save the OTP to the database even if the email sending fails
        const saveResponse = await saveOtpToDatabase(email, otp, false);
        if (!saveResponse) {
            return { success: false, message: 'Failed to save OTP to database' };
        }
        // Return success even if the email sending fails
        return { success: false, message: 'Failed to send OTP', otpId: otpId };
    }
}
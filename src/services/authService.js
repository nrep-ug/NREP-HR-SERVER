import {databases, hrDb, ID} from '../config/appwrite.js';
import { sendEmail, isNrepUgEmail, currentDateTime } from '../utils/utils.js';

const users = [
    { id: 'user1', password: 'password123' },
    // Add more users as needed
];
export const userSignin = async (data) => {
    console.log('Logging in user: ', data)
    const user = users.find(u => u.id === data.userID && u.password === data.password);
    if (user) {
        return { success: true };
    } else {
        return { success: false, message: 'Invalid credentials' };
    }
}; //TODO: Real login functionality to be implemented

// OTP Request
export const requestOTP = async (data) => {
    console.log('Requesting OTP for user: ', data)
    const { email } = data;
    
    const otpId = `OTP-EM-${ID.unique()}`; // Generate a unique ID for the OTP document

    //Function to save OTP details to database
    const saveOtpToDatabase = async (email, otp, emailSent) => {
        try {
            const response = await databases.createDocument(
                hrDatabaseId,
                hrDb.otpRequestTableId,
                otpId,
                {
                    otpId: otpId,
                    email: email,
                    otp: `${otp}`,
                    emailSent: emailSent,
                    validTime: data.timeValidity,
                    creationDate: currentDateTime,
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
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
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
        console.log('Save response:', saveResponse);
        if (!saveResponse) {
            return { success: false, message: 'Failed to save OTP to database' };
        }
        // Otp token shouldn't be sent back to the client for security reasons
        return { success: true, message: 'OTP sent successfully', otpId: otpId };
    } else {
        console.error('Error sending email:', sendEmailResponse);
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
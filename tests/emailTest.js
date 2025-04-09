import { sendEmail } from '../utils/utils.js';

(async () => {
    try {
        const response = await sendEmail({
            to: 'derrickmaiku@gmail.com',
            subject: 'Welcome to NREP',
            html: '<h1>Hello!</h1><p>Welcome to the National Renewable Energy Platform.</p>',
            text: 'Hello! Welcome to the National Renewable Energy Platform.',
        });

        console.log('Email response:', response);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
})();

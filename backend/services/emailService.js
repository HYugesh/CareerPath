const nodemailer = require('nodemailer');

/**
 * Enhanced Email Service
 * Supports multiple email providers with fallback to Ethereal for testing
 */
const sendEmail = async (options) => {
    let transporter;

    // Check if we have real credentials
    const hasCredentials = process.env.EMAIL_USER &&
        process.env.EMAIL_USER !== 'your-email@gmail.com' &&
        process.env.EMAIL_USER !== 'your_user_here';

    if (hasCredentials) {
        // Determine email provider and configure accordingly
        const emailProvider = process.env.EMAIL_USER.includes('@gmail.com') ? 'gmail' : 'custom';
        
        if (emailProvider === 'gmail') {
            // Gmail-specific configuration
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS, // Must be App Password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        } else {
            // Generic SMTP configuration for other providers
            transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT),
                secure: process.env.EMAIL_PORT === '465',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }
    } else {
        // 2. Fallback to Ethereal Email (Auto-generated test account)
        console.log("No email credentials found. Generating test account...");
        const testAccount = await nodemailer.createTestAccount();

        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log(`Test account created: ${testAccount.user}`);
    }

    const mailOptions = {
        from: `"CareerPath AI" <${process.env.EMAIL_FROM || 'noreply@careerpath.ai'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");

        // If using ethereal, log the URL to view the email
        if (!hasCredentials) {
            console.log("--------------------------------------------------");
            console.log("PREVIEW URL:", nodemailer.getTestMessageUrl(info));
            console.log("--------------------------------------------------");
        }

        return info;
    } catch (error) {
        console.error("Nodemailer Error:", error);
        throw error;
    }
};

module.exports = sendEmail;

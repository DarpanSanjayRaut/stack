const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
    },
});

async function sendEmail(userId, taskContent) {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'user-email@example.com',  // Ideally fetch from DB based on userId
        subject: 'Task Completion Notification',
        text: `Your task is completed. Here are the generated posts:\n\n${JSON.stringify(taskContent, null, 2)}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = { sendEmail };

const nodemailer = require('nodemailer');

async function wrapedSendMail(mailOptions){
    return new Promise((resolve,reject) => {
        const transporter = nodemailer.createTransport({
            port: process.env.MAIL_PORT,
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
            secure: true,
            tls: {
                rejectUnauthorized: process.env.APP_ENV === 'production' ? true : false
            }
        });

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log("error is "+error);
                resolve(false); // or use reject(false) but then you will have to handle errors
            } 
            else {
                console.log('Email sent: ' + info.response);
                resolve(true);
            }
        });
    })
}

module.exports.sendClientMessage = async (req, res, next) => {
    try {
        const { name, email, message } = req.body;

        const mailData = {
            from: process.env.MAIL_USERNAME,  // sender address
            to: process.env.MAIL_USERNAME_TO,   // list of receivers
            subject: `Prospective client's message`,
            text: message,
            html: `<b>Name: </b> ${name} <br>
                <b>Email: </b> ${email} <br>
                <b>Message: </b> ${message}`
        };

        const sendEmail = await wrapedSendMail(mailData);

        if (!sendEmail) {
            req.flash('error', 'Failed to send message!');
            res.redirect('contact');
        }

        req.flash('success', 'Your message has been successfully sent!');
        res.redirect('contact');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('contact');
    }   
};

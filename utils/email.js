const emailjs = require('@emailjs/nodejs');
emailjs.init({
    publicKey: process.env.EMAIL_PUBLIC_KEY,
    privateKey: process.env.EMAIL_PRIVATE_KEY,
})


class Email {
    constructor(user, from) {
        this.to_email = user.email;
        this.to_name = user.name;
        this.from_email = from;
    }
    async sendPasswordReset(resetLink) {
        const templateParams = {
            to_email: this.to_email,
            from_email: this.from_email,
            reset_link: resetLink
        }
        await emailjs.send(process.env.EMAIL_SERVICE_ID, process.env.PASSWORD_RESET_EMAIL_TEMPLATE_ID, templateParams);
    }

    async sendVerification(verificationLink) {
        const templateParams = {
            to_email: this.to_email,
            to_name: this.to_name,
            from_email: this.from_email,
            verify_link: verificationLink
        }
        await emailjs.send(process.env.EMAIL_SERVICE_ID, '', templateParams);
    }
}

module.exports = Email;
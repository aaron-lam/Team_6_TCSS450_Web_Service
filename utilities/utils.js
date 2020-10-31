//Get the connection to Heroku Database
let pool = require('./sql_conn.js')

//We use this create the SHA256 hash
const crypto = require("crypto")

const nodemailer = require('nodemailer')

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
    },
    secure: true,
})

function sendEmail(from, receiver, code, subj, message) {

    //production
    //const messageContents = `<b>Hey there! </b> <br> https://team6-tcss450-web-service.herokuapp.com/verification/${code}<br/>`

    //heroku local
    const messageContents = `<b>Hey there! </b> <br> https://localhost:5000/verification/${code}<br/>`


    const mailData = {
        from,  // sender address
        to: receiver,   // list of receivers
        subject: subj,
        text: message,
        html: messageContents
    }
    transporter.sendMail(mailData, (error, info) => console.log(error ? error : info))
}

/**
 * Method to get a salted hash.
 * We put this in its own method to keep consistency
 * @param {string} pw the password to hash
 * @param {string} salt the salt to use when hashing
 */
function getHash(pw, salt) {
    return crypto.createHash("sha256").update(pw + salt).digest("hex")
}


module.exports = {
    pool, getHash, sendEmail
}

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

function sendEmail(from, receiver, subj, message) {
    const mailData = {
        from,  // sender address
        to: receiver,   // list of receivers
        subject: subj,
        text: subj,
        html: message
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

function parseWeather(weatherData) {
    let days = { 0:'Sun ', 1:'Mon ', 2:'Tue ', 3:'Wed ', 4:'Th ', 5:'Fri ', 6:'Sat '}
    let time = new Date(weatherData.dt * 1000)
    return {day: days[time.getDay()] + time.getDay, temp: weatherData.temp.day}    
}


module.exports = {
    pool, getHash, sendEmail, parseWeather
}

//Get the connection to Heroku Database
let pool = require('./sql_conn.js')

//We use this create the SHA256 hash
const crypto = require("crypto")

const nodemailer = require('nodemailer')

let messaging = require('./pushy_utilities.js')

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

/**
 * 
 * @param {List[JSON]} weatherData Data set from OpenWeather API for daily weather
 */
function parseWeather(weatherData) {
    let days = { 0:'Sun ', 1:'Mon ', 2:'Tue ', 3:'Wed ', 4:'Th ', 5:'Fri ', 6:'Sat '}
    let time = new Date(weatherData.dt * 1000)
    return {
        day: days[time.getDay()] + time.getDate(),
        weather: weatherData.weather[0].main, 
        temp: weatherData.temp.day
    }    
}

/**
 * Extracts Data from API to data desired for application
 * @param {List[JSON]} weatherData  Data set from OpenWeather API for hourly weather
 * @returns {List[JSON]} returns weather type, temperature, windspeed, humidity for each hour
 */
function parseForecast(hourlyData) {
    let data = []
    hourlyData.forEach(hour => {
        data.push({
            weather: hour.weather[0].main,
            temp: hour.temp,
            humidity: hour.humidity,
            wind_speed: hour.wind_speed
        }) 
    })
    return data
}


module.exports = {

    pool, getHash, sendEmail, messaging, parseWeather, parseForecast

}

//express is the framework we're going to use to handle requests
const express = require('express')

const router = express.Router()
router.use(express.json())

const axios = require('axios')
const zipcodes = require('zipcodes')

let parseCurrentWeather = require('../utilities/utils').parseCurrentWeather
let parseWeather = require('../utilities/utils').parseWeather
let parseForecast = require('../utilities/utils').parseForecast


/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

/**
 * @api {Get} /weather/location Request weather data based on a lat/long
 * @apiName GetWeather
 * @apiGroup Weather
 * 
 * @apiHeader {Number} Latitude
 * @apiHeader {Number} Longitude
 * 
 * @apiSuccess (Success 200) {JSON} weather object containing data for the week
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Weather API Error) {String} message "Axios Error Message"
 *
 * @apiError (400: Malformed lat/long) {String} message "Location not found"
 * 
 * @apiUse JSONError
 */ 
router.get('/location', (req, res) => {

    let lat = req.headers.lat
    let long = req.headers.long
    let zipcode = req.headers.zipcode

    if(zipcode) {
        const zipcodeInfo = zipcodes.lookup(zipcode);
        lat = zipcodeInfo.latitude
        long = zipcodeInfo.longitude
    }   

    if (lat && long) {
        temperatures = []
        excludeParams = "minutely,alerts"
        axios.get(
            `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=${excludeParams}&units=imperial&appid=${process.env.WEATHER_KEY}`)
        .then(weatherRes => {
            weatherData = weatherRes.data
            forecast = parseForecast(weatherData.hourly)
            temperatures.push(parseCurrentWeather(weatherData.current))
            for(let i = 1; i < 7; i++) {
                temperatures.push(parseWeather(weatherData.daily[i]))
            }
            res.json({
                forecast: forecast,
                daily: temperatures
            })
        })
        .catch(error => {
            console.log(error);
            res.status(400).send({
                message: error
            })
        }) 
    } else {
        res.status(400).send({
            message: "Missing required information"
        })
    }
});

module.exports = router

//express is the framework we're going to use to handle requests
const express = require('express')

const router = express.Router()
router.use(express.json())

const axios = require('axios')
const zipcodes = require('zipcodes')
const cities = require('cities')

let parseCurrentWeather = require('../utilities/weather_utils').parseCurrentWeather
let parseWeather = require('../utilities/weather_utils').parseWeather
let parseForecast = require('../utilities/weather_utils').parseForecast
let validZipcode = require('../utilities/weather_utils').validZipcode

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {Get} /weather/location Request weather data based on a lat/long
 * @apiName GetWeather
 * @apiGroup Weather
 *
 * @apiHeader {Number} lat Latitude
 * @apiHeader {Number} long Longitude
 * @apiHeader {Number} zipcode zip code
 *
 * @apiSuccess (Success 200) {JSON} weather object containing data for the week
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (400: Weather API Error) {String} message "Axios Error Message"
 *
 * @apiError (400: Malformed lat/long) {String} message "Location not found"
 *
 * @apiError (400: Invalid Zip Code) {String} message "Invalid Zip Code"
 *
 * @apiUse JSONError
 */
router.get('/location', (req, res) => {

    let lat = req.headers.lat
    let long = req.headers.long
    let zipcode = req.headers.zipcode

    if(zipcode) {
        if(validZipcode(zipcode)) {
            const zipcodeInfo = zipcodes.lookup(zipcode)
            if(zipcodeInfo) {
                lat = zipcodeInfo.latitude
                long = zipcodeInfo.longitude
            } else {
                return res.status(400).send({
                    message: "Invalid Zip Code"
                })
            }
        } else {
            return res.status(400).send({
                message: "Invalid Zip Code"
            })
        }
    }

    if (lat && long) {
        const cityData = cities.gpsLookup(lat, long);

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
                city: cityData.city,
                state: cityData.state_abbr,
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

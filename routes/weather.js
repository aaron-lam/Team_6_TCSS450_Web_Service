//express is the framework we're going to use to handle requests
const express = require('express')

const router = express.Router()
router.use(express.json())

const axios = require('axios')


let parseWeather = require('../utilities/utils').parseWeather


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

    if (lat && long) {
        temperatures = []
        excludeParams = "minutely,hourly,alerts"
        axios.get(
            `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=${excludeParams}&units=imperial&appid=${process.env.WEATHER_KEY}`)
        .then(weatherRes => {
            weatherData = weatherRes.data
            temperatures.push({
                day: 'Today',
                weather: weatherData.current.weather[0].main, 
                temp: weatherData.current.temp
            });
            for(let i = 1; i < 7; i++) {
                temperatures.push(parseWeather(weatherData.daily[i]));
            }
            res.json({
                data: temperatures
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

//express is the framework we're going to use to handle requests
const express = require('express')

const router = express.Router()
router.use(express.json())

const pool = require('../utilities/utils').pool
const bodyParser = require("body-parser")

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
                lat: lat,
                long: long,
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

/**
 * @api {Get} /weather/favorite Request a user's favorite weather locations
 * @apiName GetFavoriteWeather
 * @apiGroup Weather
 *
 * @apiSuccess (Success 200) {JSON} JSON object with scucess messages
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiUse JSONError
 */
router.get("/favorite", (request, response) => {
    const userId = request.decoded.memberid
    const query = 'SELECT CityName, StateName, Lat, Long FROM LOCATIONS WHERE MemberID=$1'
    const values = [userId]

    pool.query(query, values)
    .then(result => {
        response.send({
            favorites: result.rows
        })
    })
    .catch(error => {
        response.status(400).send({
            message: "SQL Error",
            error: error 
        })
    })
})

router.post("/favorite", (request, response) => {

    const userId = request.decoded.memberid
    const city = request.body.city
    const state = request.body.state
    const lat = request.body.lat
    const long = request.body.long

    if(lat && long && city && state) {
        const query = 'INSERT INTO LOCATIONS(MemberID, CityName, StateName, Lat, Long) VALUES($1, $2, $3, $4, $5)'
        const values = [userId, city, state, lat, long]
        pool.query(query, values)
        .then(result => {
            response.send({
                success: true
            })
        })
        .catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error 
            })
        })
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
})

router.delete("/favorite", (request, response) => {
    const userId = request.decoded.memberid
    const city = request.body.city
    const state = request.body.state
    const lat = request.body.lat
    const long = request.body.long

    
    if(lat && long && city && state) {
        const query = `DELETE FROM LOCATIONS WHERE MemberID=$1 AND CityName=$2 AND StateName=$3
                            AND Lat=$4 AND Long=$5`
        const values = [userId, city, state, lat, long]
        pool.query(query, values)
        .then(result => {
            response.send({
                success: true
            })
        })
        .catch(error => {
            response.status(400).send({
                message: "SQL Error",
                error: error 
            })
        })
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
})

module.exports = router

//express is the framework we're going to use to handle requests
const express = require('express')

const router = express.Router()
router.use(express.json())

const axios = require('axios')


let parseWeather = require('../utilities/utils').parseWeather


router.get('/location', (req, res) => {

    let lat = req.headers.lat
    let long = req.headers.long

    if (lat && long) {
        temperatures = []
        excludeParams = "minutely,hourly,alerts"
        axios.get(
            `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude=${excludeParams}&units=imperial&appid=${process.env.WEATHER_KEY}`)
        .then(weatherRes => {
            console.log("Weather: " + weatherRes);
            temperatures.push({day: 'Today', temp: weatherRes.current.temp});
            for(let i = 1; i < 7; i++) {
                temperatures.push(parseWeather(weatherRes.daily[i]));
            }
            res.json({
                data: temperatures
            })
        })
        .catch(error => {
            console.log(error);
            res.status(400).send({
                message: "Error occured"
            })
        }) 
    } else {
        res.status(400).send({
            message: "Missing required information"
        })
    }
});

router.get('/city', (req, res) => {
    if(req.headers.city) {

    } else {
        res.status(400).send({
            message: "Missing required information"
        })
    }
})

module.exports = router

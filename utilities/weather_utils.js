/**
 * 
 * @param {List[JSON]} weatherData Data set from OpenWeather API for daily weather
 */
function parseWeather(weatherData) {

    return {
        day: getDate(weatherData.dt),
        weather: weatherData.weather[0].main, 
        temp: weatherData.temp.day,
        humidity: weatherData.humidity,
        wind_speed:weatherData.wind_speed
    }    
}

function parseCurrentWeather(weatherData) {
    return {
        day: getDate(weatherData.dt),
        weather: weatherData.weather[0].main, 
        temp: weatherData.temp,
        humidity: weatherData.humidity,
        wind_speed:weatherData.wind_speed
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

function getDate(dt) {
    let days = { 0:'Sun ', 1:'Mon ', 2:'Tue ', 3:'Wed ', 4:'Th ', 5:'Fri ', 6:'Sat '}
    let time = new Date(dt * 1000)
    return days[time.getDay()] + time.getDate();
}


module.exports = {
    parseCurrentWeather, parseWeather, parseForecast
}

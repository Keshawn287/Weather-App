"use strict";
// API key and base URL for OpenWeatherMap API
const apiKey = "API_KEY_HERE";

const searchBar = document.querySelector(".search-bar input");
const cityElement = document.querySelector(".city");
const tempElement = document.querySelector(".temp");
const descElement = document.querySelector(".description");
const weatherIcon = document.querySelector(".weather-icon");
const timeElement = document.querySelector(".time");
const humidityElement = document.querySelector(".humidity");
const feelsLikeElement = document.querySelector(".feels-like");
const windSpeedElement = document.querySelector(".wind-speed");
const pressureElement = document.querySelector(".pressure");

//add event listener to search bar for 'Enter' key press...need to get city name from user input
searchBar.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    const userInput = searchBar.value.trim();
    if (!userInput) return; //if empty input, do nothing
    const city = encodeURIComponent(userInput);
    //fetch weather data from API
    getWeatherDataByCity(city); //function declarations can be called before they are defined
  }
});
// Function to fetch GOE location of city --> https://openweathermap.org/api/geocoding-api
async function getWeatherDataByCity(city) {
  try {
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;
    //https://api.openweathermap.org/geo/1.0/direct?q=Atlanta&limit=1&appid=efe3512d9c30f6cf91829a8d08d60793
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();
    if (geoData.length === 0 || !Array.isArray(geoData)) {
      throw new Error("City not found");
    }
    const { lat, lon, name, state, country } = geoData[0];
    await getWeatherDataByCoords(lat, lon, {
      displayName: [name, state, country].filter(Boolean).join(", "),
    });
  } catch (err) {
    alert(err.message);
  }
}
// Function to get forcast from lat and lon values
async function getWeatherDataByCoords(lat, lon, meta = {}) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Failed to fetch forecast");
    }
    updateWeatherFromForcast(data, meta.displayName);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}
//Update forcast for user in UI
function updateWeatherFromForcast(forecast, overrideCityName) {
  // forecast.city = { name, timezone, coord:{lat,lon}, ... }
  // forecast.list = [ { dt, main:{temp, feels_like, pressure, humidity}, weather:[{description, icon}], wind:{speed}, dt_txt }, ... ]

  const slot = forecast.list?.[0];
  if (!slot) {
    alert("No forecast data available");
    return;
  }
  const cityName = overrideCityName || forecast.city?.name || "Unknown";
  const tzOffsetSec = forecast.city?.timezone ?? 0; // seconds offset from UTC
  const localTsMs = (slot.dt + tzOffsetSec) * 1000;
  const localTime = new Date(localTsMs).toLocaleString();

  cityElement.textContent = `Forecast for ${cityName}`;
  tempElement.textContent = `${Math.round(slot.main.temp)}°C`;
  descElement.textContent = `Description: ${
    slot.weather?.[0]?.description ?? "--"
  }`;
  timeElement.textContent = `Local Time: ${localTime}`;
  humidityElement.textContent = `Humidity: ${slot.main.humidity}%`;
  feelsLikeElement.textContent = `Feels Like: ${Math.round(
    slot.main.feels_like
  )}°C`;
  windSpeedElement.textContent = `Wind Speed: ${slot.wind?.speed ?? "--"} m/s`;
  pressureElement.textContent = `Pressure: ${slot.main.pressure} hPa`;

  if (weatherIcon && slot.weather?.[0]?.icon) {
    weatherIcon.src = `https://openweathermap.org/img/wn/${slot.weather[0].icon}@2x.png`;
    weatherIcon.alt = slot.weather[0].description || "Weather icon";
  }
}

getWeatherDataByCoords(33.749, -84.388, { displayName: "Atlanta, GA" });

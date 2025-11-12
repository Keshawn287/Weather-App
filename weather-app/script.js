"use strict";
// API key and base URL for OpenWeatherMap API
const apiKey = "efe3512d9c30f6cf91829a8d08d60793";
const apiUrl =
  "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

// Selecting DOM elements...set up as classes so using querySelector is better
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
    const city = encodeURIComponent(raw);
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
//https://api.openweathermap.org/data/3.0/onecall?lat=33.749&lon=-84.388&appid=fc24932d04f9bbc4df5b13f6d0f7268e

//https://api.openweathermap.org/data/3.0/onecall?lat=33.749&lon=-84.388&appid=fc24932d04f9bbc4df5b13f6d0f7268e
//https://api.openweathermap.org/data/2.5/forecast?lat=33.749&lon=-84.388&appid=fc24932d04f9bbc4df5b13f6d0f7268e&units=metric

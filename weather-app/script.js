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
const chanceOfRainElement = document.querySelector(".rain");
const highLowElement = document.querySelector(".high-low");
const dateElement = document.querySelector(".date");

const futureCards = document.querySelectorAll(".weather-future-card"); // want to build a 5 day forecast

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
    // const { lat, lon, name, state, country } = geoData[0];
    const { lat, lon, name } = geoData[0];
    await getWeatherDataByCoords(lat, lon, {
      // displayName: [name, state, country].filter(Boolean).join(", "),
      displayName: [name].filter(Boolean).join(", "),
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

function getFiveDayForecast(forcast) {
  const list = forcast.list || [];
  const byDate = new Map();

  for (const item of list) {
    if (!item.dt_txt) continue;
    const [date] = item.dt_txt.split(" "); // "todays date"
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(item);
  }
  const daily = [];

  for (const [date, items] of byDate.entries()) {
    let minTemp = Infinity;
    let maxTemp = -Infinity;

    for (const s of items) {
      if (typeof s.main?.temp_min === "number") {
        minTemp = Math.min(minTemp, s.main.temp_min);
      }
      if (typeof s.main?.temp_max === "number") {
        maxTemp = Math.max(maxTemp, s.main.temp_max);
      }
    }

    if (!isFinite(minTemp) || !isFinite(maxTemp)) continue;

    // Pick a daytime slot for icon/description
    const representative =
      items.find((i) => i.dt_txt.endsWith("15:00:00")) ||
      items.find((i) => i.dt_txt.endsWith("12:00:00")) ||
      items[0];

    daily.push({
      date,
      min: Math.round(minTemp),
      max: Math.round(maxTemp),
      icon: representative.weather?.[0]?.icon,
      description: representative.weather?.[0]?.description ?? "",
    });
  }

  // Limit to 5 days
  return daily.slice(0, 5);
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
  const nowUtcMs = Date.now();
  const cityNow = new Date(nowUtcMs + tzOffsetSec * 1000 + 5 * 3600 * 1000); //trying to adjust for UTC time...don't want that to show

  const cityTimeString = cityNow.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const cityDateString = cityNow.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  cityElement.textContent = `${cityName}`;
  descElement.textContent = `${slot.weather?.[0]?.description ?? "--"}`;

  tempElement.textContent = `${Math.round(slot.main.temp)}°C`;
  // timeElement.textContent = `${cityTimeString}`;
  if (dateElement) {
    // dateElement.textContent = cityDateString;
    feelsLikeElement.innerHTML = `
    <div class="feels-like">
      <span>${cityDateString}</span></br>
      <span>${cityTimeString}</span></br>
      <span>Feels Like ${Math.round(slot.main.feels_like)}°C</span>
    </div>  
  `;
  }

  if (highLowElement) {
    const todaysDate = slot.dt_txt?.split(" ")[0]; //Getting today's look up date from API JSON
    let minTemp = Infinity;
    let maxTemp = -Infinity;

    for (const s of forecast.list) {
      if (!s.dt_txt) continue;
      const date = s.dt_txt.split(" ")[0];
      if (date !== todaysDate) continue;

      if (typeof s.main?.temp_min === "number") {
        minTemp = Math.min(minTemp, s.main.temp_min);
      }
      if (typeof s.main?.temp_max === "number") {
        maxTemp = Math.max(maxTemp, s.main.temp_max);
      }
    }

    // Fallback if something went weird
    if (!isFinite(minTemp)) minTemp = slot.main.temp_min;
    if (!isFinite(maxTemp)) maxTemp = slot.main.temp_max;
    const minRounded = Math.round(minTemp);
    const maxRounded = Math.round(maxTemp);

    highLowElement.innerHTML = `
      <div class="misc-content">
        <i class="wi wi-thermometer"></i>
        <span class="value">${maxRounded}° / ${minRounded}°</span>
        <span class="label">High / Low</span>
      </div>
      `;
  }

  if (chanceOfRainElement) {
    const rainChance = slot.pop ?? 0; //0-100 percent
    const rainChancePercent = Math.round(rainChance * 100);

    chanceOfRainElement.innerHTML = `
    <div class="misc-content">
      <i class="wi wi-rain"></i>
      <span class="value">${rainChancePercent}%</span>
      <span class="label">Chance of Rain</span>
    </div>
    
    `;
  }

  humidityElement.innerHTML = `
  <div class="misc-content">
    <i class="wi wi-humidity"></i>
    <span class="value">${slot.main.humidity}%</span>
    <span class="label">Humidity</span>
  </div>
  `;

  windSpeedElement.innerHTML = `
    <div class="misc-content">
      <i class="wi wi-strong-wind"></i>
      <span class="value">${slot.wind?.speed ?? "--"} m/s</span>
      <span class="label">Wind Speed</span>
  </div>
  
  
  `;

  // ---- 5-day forecast into existing grid ----

  if (futureCards && futureCards.length) {
    const dailyForecast = getFiveDayForecast(forecast);
    const daysToShow = dailyForecast.slice(1, 5);
    futureCards.forEach((card, index) => {
      const day = daysToShow[index];

      if (!day) {
        // No data for this card slot → hide or clear it
        card.innerHTML = "";
        card.style.visibility = "hidden"; // or display: "none"
        return;
      }

      card.style.visibility = "visible";

      const d = new Date(day.date + "T00:00:00");
      const weekday = d.toLocaleDateString(undefined, { weekday: "short" });

      card.innerHTML = `


          <span>${weekday}</span>
          <div>
          <img
            class="forecast-icon"
            src="https://openweathermap.org/img/wn/${day.icon}@2x.png"
            alt="${day.description}"
          /></div>
          <span>${day.max}°/${day.min}°</span>
          <div>
          <span>${day.description}</span>
          </div>
      `;
    });
  }

  if (weatherIcon && slot.weather?.[0]?.icon) {
    weatherIcon.src = `https://openweathermap.org/img/wn/${slot.weather[0].icon}@2x.png`;
    weatherIcon.alt = slot.weather[0].description || "Weather icon";
  }
}

getWeatherDataByCoords(33.749, -84.388, { displayName: "Atlanta" });

// cityElement.textContent = `${cityName}`;
// descElement.textContent = `Description: ${
//   slot.weather?.[0]?.description ?? "--"
// }`;
// timeElement.textContent = `Local Time: ${localTime}`;
// humidityElement.textContent = `Humidity: ${slot.main.humidity}%`;
// feelsLikeElement.textContent = `Feels Like: ${Math.round(
//   slot.main.feels_like
// )}°C`;
// windSpeedElement.textContent = `Wind Speed: ${slot.wind?.speed ?? "--"} m/s`;
// pressureElement.textContent = `Pressure: ${slot.main.pressure} hPa`;
// tempElement.textContent = `${Math.round(slot.main.temp)}°C`;

// | Purpose     | Class               |
// | ----------- | ------------------- |
// | Humidity    | `wi wi-humidity`    |
// | Wind        | `wi wi-strong-wind` |
// | Pressure    | `wi wi-barometer`   |
// | Temperature | `wi wi-thermometer` |
// | Cloudy      | `wi wi-cloudy`      |
// | Sunny       | `wi wi-day-sunny`   |
// | Rain        | `wi wi-rain`        |

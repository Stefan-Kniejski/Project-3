const apiKey = 'a418579ff161632a4683b04d402e845a'; // Replace with your OpenWeatherMap API key
const cityInput = document.getElementById('city-input');
const temperatureCelsiusInput = document.getElementById('temperature-celsius');
const temperatureFahrenheitInput = document.getElementById('temperature-fahrenheit');
const map = L.map('map').setView([0, 0], 2); // Set an initial center and zoom level for the map
let marker = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
}).addTo(map);

document.getElementById('show-weather-button').addEventListener('click', () => {
    const enteredCity = cityInput.value;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${enteredCity}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            // Get the temperature in Celsius and Fahrenheit
            const temperatureKelvin = data.main.temp;
            const temperatureCelsius = (temperatureKelvin - 273.15).toFixed(2);
            const temperatureFahrenheit = ((temperatureKelvin - 273.15) * 9/5 + 32).toFixed(2);

            // Update the temperature values
            temperatureCelsiusInput.textContent = temperatureCelsius;
            temperatureFahrenheitInput.textContent = temperatureFahrenheit;

            // Update the map with the entered city
            const cityCoordinates = [data.coord.lat, data.coord.lon];
            if (marker) {
                map.removeLayer(marker);
            }

            // Create a marker with a popup showing the temperature
            marker = L.marker(cityCoordinates)
                .bindPopup(`Temperature: ${temperatureCelsius}°C / ${temperatureFahrenheit}°F`)
                .addTo(map);

            marker.openPopup(); // Open the popup by default

            map.setView(cityCoordinates, 8);
        })
        .catch(error => console.error(error));
});








const apiKey = 'a418579ff161632a4683b04d402e845a'; // Replace with your OpenWeatherMap API key
const cityInput = document.getElementById('city-input');
const temperatureCelsiusInput = document.getElementById('temperature-celsius');
const temperatureFahrenheitInput = document.getElementById('temperature-fahrenheit');
const map = L.map('map').setView([0, 0], 2); // Set an initial center and zoom level for the map
let marker = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
}).addTo(map);

// Function to create the bar charts
function createDoubleBarChart(chartID, labels, highData, lowData, yAxisLabel, title) {
    const ctx = document.getElementById(chartID).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'High Temperature',
                    data: highData,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)', // Red for high temperature
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Low Temperature',
                    data: lowData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)', // Blue for low temperature
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            layout: {
                padding: {
                    top: 0, // Reduce the top padding to minimize the gap
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel,
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                },
            },
        },
    });
}

document.getElementById('show-weather-button').addEventListener('click', () => {
    const enteredCity = cityInput.value;

    // Fetch current weather data
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${enteredCity}&appid=${apiKey}`)
        .then((response) => response.json())
        .then((currentData) => {
            // Get the current temperature and other weather data
            const currentTemperatureKelvin = currentData.main.temp;
            const currentTemperatureCelsius = (currentTemperatureKelvin - 273.15).toFixed(2);
            const currentTemperatureFahrenheit = (
                (currentTemperatureKelvin - 273.15) * 9 / 5 +
                32
            ).toFixed(2);

            // Update the current temperature values
            temperatureCelsiusInput.textContent = currentTemperatureCelsius;
            temperatureFahrenheitInput.textContent = currentTemperatureFahrenheit;

            // Get other weather data
            const humidity = currentData.main.humidity;
            const precipitation = currentData.rain ? currentData.rain['1h'] : 0; // Precipitation in the last hour (if available)
            const cloudiness = currentData.clouds.all;
            const windSpeed = currentData.wind.speed;

            // Update the other weather data in the textboxes
            document.getElementById('humidity').textContent = humidity + '%';
            document.getElementById('precipitation').textContent = precipitation + ' mm';
            document.getElementById('cloudiness').textContent = cloudiness + '%';
            document.getElementById('wind-speed').textContent = windSpeed + ' m/s';

            // Update the map with the entered city
            const cityCoordinates = [currentData.coord.lat, currentData.coord.lon];
            if (marker) {
                map.removeLayer(marker);
            }

            // Create a marker with a popup showing all the weather data
            marker = L.marker(cityCoordinates)
                .bindPopup(
                    `Temperature: ${currentTemperatureCelsius}°C / ${currentTemperatureFahrenheit}°F<br>` +
                    `Humidity: ${humidity}%<br>` +
                    `Precipitation: ${precipitation} mm<br>` +
                    `Cloudiness: ${cloudiness}%<br>` +
                    `Wind Speed: ${windSpeed} m/s`
                )
                .addTo(map);

            marker.openPopup(); // Open the popup by default

            map.setView(cityCoordinates, 8);

            // Fetch daily weather forecast data for the next 6 days
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${enteredCity}&appid=${apiKey}`)
                .then((response) => response.json())
                .then((data) => {
                    // Extract one entry per day for the next 6 days (excluding the last 2 days)
                    const forecastData = data.list;
                    const labels = [];
                    const highTemperatureCelsius = [];
                    const lowTemperatureCelsius = [];
                    const highTemperatureFahrenheit = [];
                    const lowTemperatureFahrenheit = [];

                    const today = new Date(); // Get the current date
                    for (let i = 0; i < 6; i++) {
                        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
                        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

                        labels.push(formattedDate);
                        const dailyData = forecastData.filter((item) => {
                            const itemDate = new Date(item.dt * 1000);
                            return (
                                itemDate.getFullYear() === date.getFullYear() &&
                                itemDate.getMonth() === date.getMonth() &&
                                itemDate.getDate() === date.getDate()
                            );
                        });
                        const highTemp = Math.max(...dailyData.map((item) => item.main.temp));
                        const lowTemp = Math.min(...dailyData.map((item) => item.main.temp));

                        highTemperatureCelsius.push((highTemp - 273.15).toFixed(2));
                        lowTemperatureCelsius.push((lowTemp - 273.15).toFixed(2));
                        highTemperatureFahrenheit.push(((highTemp - 273.15) * 9 / 5 + 32).toFixed(2));
                        lowTemperatureFahrenheit.push(((lowTemp - 273.15) * 9 / 5 + 32).toFixed(2));
                    }

                    // Create and update the double bar charts for Celsius and Fahrenheit
                    createDoubleBarChart(
                        'temperature-chart-celsius',
                        labels,
                        highTemperatureCelsius,
                        lowTemperatureCelsius,
                        'Temperature Forecast (°C)',
                        'Temperature Forecast (°C)'
                    );
                    createDoubleBarChart(
                        'temperature-chart-fahrenheit',
                        labels,
                        highTemperatureFahrenheit,
                        lowTemperatureFahrenheit,
                        'Temperature Forecast (°F)',
                        'Temperature Forecast (°F)'
                    );
                })
                .catch((error) => console.error(error));
        })
        .catch((error) => console.error(error));
});

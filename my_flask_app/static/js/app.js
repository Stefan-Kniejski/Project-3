// Set your API key and units
let apiKey = "b94cd3922224f8eb48df6659b31b309b";
let units = "imperial"; // You can change to "metric" for Celsius
const cityInput = document.getElementById('city-input');
const temperatureCelsiusInput = document.getElementById('temperature-celsius');
const temperatureFahrenheitInput = document.getElementById('temperature-fahrenheit');

let marker = null;

// Initialize the map
let map = L.map('map').setView([0, 0], 1);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Declare a variable to store the destination city
let destinationCity;

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

// Function to display weather information
function displayWeather(data) {
    let weatherInfo = d3.select("#weather-info");
    weatherInfo.html(""); // Clear previous data
    destinationCity = data.name;

    if (data.main && data.weather) {
        // Extract and display temperature and description
        let temperature = data.main.temp;
        let description = data.weather[0].description;
        
        // Create HTML elements to display weather information
        weatherInfo
            .append("p")
            .text(`City: ${data.name}`);
        weatherInfo
            .append("p")
            .text(`Temperature: ${temperature} °F`);
        weatherInfo
            .append("p")
            .text(`Description: ${description}`);
    } else {
        weatherInfo
            .append("p")
            .text("Weather data not found.");
    }
}

// Listen for the button click event
d3.select("#submit").on("click", function () {
    
});

// Function to display the map
function displayMap(coord) {
    map.setView([coord.lat, coord.lon], 10);
    let marker = L.marker([coord.lat, coord.lon]).addTo(map);
    
    // Adding a popup with additional weather information
    let openWeatherMapUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}&units=${units}`;
    d3.json(openWeatherMapUrl).then(data => {
        if (data) {
            // Print the data to the console
            console.log(data);
            
            // Create and set the popup with additional weather information
            marker.bindPopup(createWeatherPopupContent(data));
        }
    });
}

// Function to create the content for the weather popup
function createWeatherPopupContent(data) {
    if (data.main && data.weather) {
        // Extract and display additional weather information
        let feelsLike = data.main.feels_like;
        let humidity = data.main.humidity;
        let pressure = data.main.pressure;
        let description = data.weather[0].description;

        const content = `
            <p>City: ${data.name}</p>
            <p>Feels Like: ${feelsLike} °F</p>
            <p>Humidity: ${humidity}%</p>
            <p>Pressure: ${pressure} hPa</p>
            <p>Description: ${description}</p>
        `;

        return content;
    } 
    else {
        return "Weather data not found.";
    }
}

document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent the form from submitting

    // Get the city from the input field
    let city = d3.select("#destinationCity").property("value");
    console.log(city);

    if (city) {
        // Create the OpenWeatherMap API URL
        let openWeatherMapUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
        
        // Fetch weather data and display it
        d3.json(openWeatherMapUrl).then(data => {
            displayWeather(data);
            displayMap(data.coord);
            logCoordinatesToConsole(data.coord); // Log the coordinates and assign them to variables
        });
    }

    // Get the form data
    const formData = new FormData(this);

    // Send a POST request to the server to get flight offers
    fetch("/get_flight_offers", {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // Handle the error here
            console.error("Flight Offers API Error:", data.error);
        } else {
            // Display the flight offers data
            displayFlightOffersData(data);
        }
    });

    // Get the entered city for the current weather
    const enteredCity = city;

    // Fetch current weather data
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${enteredCity}&appid=${apiKey}`)
        .then((response) => response.json())
        .then((currentData) => {
            // Get the current temperature and other weather data
            const currentTemperatureKelvin = currentData.main.temp;
            const currentTemperatureCelsius = (currentTemperatureKelvin - 273.15).toFixed(2);
            console.log("Temp: " + currentTemperatureCelsius);
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


// Add an event listener for the "show-weather-button" click event
document.getElementById('show-weather-button').addEventListener('click', getWeatherAndFlightOffers);

// Function to format a date string in a user-friendly format
function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleString(); // You can customize the format further if needed
}

// Function to calculate and format the flight duration
function calculateFlightDuration(departureTime, arrivalTime) {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const durationMilliseconds = arrival - departure;
    const hours = Math.floor(durationMilliseconds / 3600000);
    const minutes = Math.round((durationMilliseconds % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

// Function to display flight offer data
function displayFlightOffersData(data) {
    // Get the element where you want to display the flight offers
    const flightOffersList = document.getElementById("flightOffersList");

    // Clear any previous data
    flightOffersList.innerHTML = "";

    // Check if data is an array and not empty and prints
    if (Array.isArray(data) && data.length > 0) {
        data.forEach(flight => {
            const flightItem = document.createElement("li");
            flightItem.innerHTML = `
            <strong>Instant Ticketing Required:</strong> ${flight.instantTicketingRequired}<br>
            <strong>Last Ticketing Date:</strong> ${flight.lastTicketingDate}<br>
            <strong>Last Ticketing Date Time:</strong> ${flight.lastTicketingDateTime}<br>
            <strong>Number of Bookable Seats:</strong> ${flight.numberOfBookableSeats}<br>
            <strong>Flight Duration:</strong> ${calculateFlightDuration(flight.itineraries[0].segments[0].departure.at, flight.itineraries[0].segments[1].arrival.at)}<br>
            <strong>Departure Time:</strong> ${formatTime(flight.itineraries[0].segments[0].departure.at)}<br>
            <strong>Arrival Time:</strong> ${formatTime(flight.itineraries[0].segments[1].arrival.at)}<br>
            <strong>Pricing:</strong> ${flight.price.total} ${flight.price.currency}<br>
            <strong>Carrier Information:</strong> ${flight.itineraries[0].segments[0].carrierCode} Flight ${flight.itineraries[0].segments[0].number} (${flight.itineraries[0].segments[0].aircraft.code})<br>
            <strong>Number of Stops:</strong> ${flight.itineraries[0].segments.length - 1}<br>
            <strong>Fare Details:</strong> Cabin: ${flight.travelerPricings[0].fareDetailsBySegment[0].cabin}, Class: ${flight.travelerPricings[0].fareDetailsBySegment[0].class}<br>
            `;
            flightOffersList.appendChild(flightItem);
        });
    } else {
        flightOffersList.textContent = "No flight offers found for the given criteria.";
    }
}
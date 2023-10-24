// Set your API key and units
const apiKey = "b94cd3922224f8eb48df6659b31b309b";
const units = "imperial"; // Use "imperial" for Fahrenheit

// Initialize the map
const map = L.map('map').setView([0, 0], 1);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Declare a variable to store the destination city
let destinationCity;

// Function to display weather information
function displayWeather(data) {
    const weatherInfo = d3.select("#weather-info");
    weatherInfo.html(""); // Clear previous data
    destinationCity = data.name;

    if (data.main && data.weather) {
        // Extract and display temperature and description
        const temperature = data.main.temp;
        const description = data.weather[0].description;

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

// Function to create the bar chart for Fahrenheit
function createBarChart(chartID, labels, fahrenheitHighData, fahrenheitLowData, yAxisLabel, title) {
    const ctx = document.getElementById(chartID).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'High Temperature (°F)',
                    data: fahrenheitHighData,
                    backgroundColor: 'rgba(255, 0, 0, 0.5)', // Red for high temperature
                    borderColor: 'rgba(255, 0, 0, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Low Temperature (°F)',
                    data: fahrenheitLowData,
                    backgroundColor: 'rgba(0, 0, 255, 0.5)', // Blue for low temperature
                    borderColor: 'rgba(0, 0, 255, 1)',
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

// Function to fetch temperature forecast data in Fahrenheit
function fetchTemperatureForecastInFahrenheit(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=imperial`;

    return fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            // Process the data to extract temperature and time information
            const temperatureData = data.list.map((item) => ({
                time: new Date(item.dt * 1000), // Convert timestamp to Date
                high: item.main.temp_max,
                low: item.main.temp_min,
            }));

            // Group the data by date and calculate the daily high and low temperatures
            const groupedData = {};
            temperatureData.forEach((item) => {
                const dateStr = item.time.toDateString();
                if (!groupedData[dateStr]) {
                    groupedData[dateStr] = { high: -Infinity, low: Infinity };
                }
                if (item.high > groupedData[dateStr].high) {
                    groupedData[dateStr].high = item.high;
                }
                if (item.low < groupedData[dateStr].low) {
                    groupedData[dateStr].low = item.low;
                }
            });

            const labels = Object.keys(groupedData);
            const fahrenheitHighTemperatures = labels.map((date) => groupedData[date].high);
            const fahrenheitLowTemperatures = labels.map((date) => groupedData[date].low);

            return { labels, fahrenheitHighTemperatures, fahrenheitLowTemperatures };
        });
}

// Function to display the temperature forecast bar chart in Fahrenheit
function displayTemperatureForecast(city) {
    fetchTemperatureForecastInFahrenheit(city)
        .then(({ labels, fahrenheitHighTemperatures, fahrenheitLowTemperatures }) => {
            createBarChart("high-temperature-chart", labels, fahrenheitHighTemperatures, fahrenheitLowTemperatures, "Temperature", "Temperature Forecast");
        })
        .catch((error) => {
            console.error("Error fetching temperature forecast data (Fahrenheit):", error);
        });
}

// Function to call the function to display the Celsius chart
function fetchAndDisplayTemperatureForecast(city) {
    fetchTemperatureForecastInFahrenheit(city)
        .then(() => {
            // Ensure the temperature forecast data has been successfully fetched
            displayTemperatureForecast(city);
            displayTemperatureForecastInCelsius(city); // Call this function to display the Celsius chart
        })
        .catch((error) => {
            console.error("Error fetching temperature forecast data:", error);
        });
}

// Function to create the bar chart for Celsius
function createCelsiusBarChart(chartID, labels, celsiusHighData, celsiusLowData, yAxisLabel, title) {
    const ctx = document.getElementById(chartID).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'High Temperature (°C)',
                    data: celsiusHighData,
                    backgroundColor: 'rgba(255, 0, 0, 0.5)', // Red for high temperature
                    borderColor: 'rgba(255, 0, 0, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Low Temperature (°C)',
                    data: celsiusLowData,
                    backgroundColor: 'rgba(0, 0, 255, 0.5)', // Blue for low temperature
                    borderColor: 'rgba(0, 0, 255, 1)',
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

// Function to fetch temperature forecast data in Celsius
function fetchTemperatureForecastInCelsius(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    return fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            // Process the data to extract temperature and time information in Celsius
            const temperatureData = data.list.map((item) => ({
                time: new Date(item.dt * 1000), // Convert timestamp to Date
                high: item.main.temp_max,
                low: item.main.temp_min,
            }));

            // Group the data by date and calculate the daily high and low temperatures
            const groupedData = {};
            temperatureData.forEach((item) => {
                const dateStr = item.time.toDateString();
                if (!groupedData[dateStr]) {
                    groupedData[dateStr] = { high: -Infinity, low: Infinity };
                }
                if (item.high > groupedData[dateStr].high) {
                    groupedData[dateStr].high = item.high;
                }
                if (item.low < groupedData[dateStr].low) {
                    groupedData[dateStr].low = item.low;
                }
            });

            const labels = Object.keys(groupedData);
            const celsiusHighTemperatures = labels.map((date) => groupedData[date].high);
            const celsiusLowTemperatures = labels.map((date) => groupedData[date].low);

            return { labels, celsiusHighTemperatures, celsiusLowTemperatures };
        });
}

// Function to display the temperature forecast bar chart in Celsius
function displayTemperatureForecastInCelsius(city) {
    fetchTemperatureForecastInCelsius(city)
        .then(({ labels, celsiusHighTemperatures, celsiusLowTemperatures }) => {
            createCelsiusBarChart("temperature-chart-celsius", labels, celsiusHighTemperatures, celsiusLowTemperatures, "Temperature (°C)", "Temperature Forecast (Celsius)");
        })
        .catch((error) => {
            console.error("Error fetching temperature forecast data (Celsius):", error);
        });
}

// Function to display the map
function displayMap(coord) {
    map.setView([coord.lat, coord.lon], 10);
    let marker = L.marker([coord.lat, coord.lon]).addTo(map);

    // Adding a popup with additional weather information
    const openWeatherMapUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}&units=${units}`;
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
        const feelsLike = data.main.feels_like;
        const humidity = data.main.humidity;
        const pressure = data.main.pressure;
        const description = data.weather[0].description;

        const content = `
            <p>City: ${data.name}</p>
            <p>Feels Like: ${feelsLike} °F</p>
            <p>Humidity: ${humidity}%</p>
            <p>Pressure: ${pressure} hPa</p>
            <p>Description: ${description}</p>
        `;

        return content;
    } else {
        return "Weather data not found.";
    }
}

// Function to display the flight offers in a table
<<<<<<< HEAD
function displayFlightOffersData(data) {
    const flightOffersTable = document.getElementById("flightOffersTable");
    flightOffersTable.innerHTML = ""; // Clear previous data

    if (Array.isArray(data) && data.length > 0) {
        // Sort flight offers by duration in ascending order
        data.sort((a, b) => {
=======
// Function to display the flight offers in a table
function displayFlightOffersData(data) {
    const flightOffersTable = document.getElementById("flightOffersTable");
    flightOffersTable.innerHTML = ""; // Clear previous data
    if (Array.isArray(data) && data.length > 0) {
        // Filter out flight offers without valid data
        const validFlightOffers = data.filter(flight => flight.itineraries && flight.itineraries[0] && flight.itineraries[0].segments && flight.itineraries[0].segments[0] && flight.itineraries[0].segments[1]);
        // Sort flight offers by duration in ascending order
        validFlightOffers.sort((a, b) => {
>>>>>>> 7a2f6a4fa18526aa7ac50d079bc8667db9bedc24
            const durationA = calculateFlightDuration(a.itineraries[0].segments[0].departure.at, a.itineraries[0].segments[1].arrival.at);
            const durationB = calculateFlightDuration(b.itineraries[0].segments[0].departure.at, b.itineraries[0].segments[1].arrival.at);
            return durationA.localeCompare(durationB);
        });
<<<<<<< HEAD

        const table = document.createElement("table");
        table.classList.add("flight-offers-table");

=======
        const table = document.createElement("table");
        table.classList.add("flight-offers-table");
>>>>>>> 7a2f6a4fa18526aa7ac50d079bc8667db9bedc24
        const headerRow = table.insertRow();
        headerRow.innerHTML = `
            <th>Duration</th>
            <th>Departure Time</th>
            <th>Arrival Time</th>
            <th>Pricing (USD)</th>
            <th>Carrier Information</th>
            <th>Number of Stops</th>
        `;
<<<<<<< HEAD

        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const flight = data[i];
            const row = table.insertRow();

            const eurToUsdExchangeRate = 1.18; // Replace with the actual exchange rate
            const pricingInUSD = flight.price.total * eurToUsdExchangeRate;

=======
        for (let i = 0; i < Math.min(validFlightOffers.length, 10); i++) {
            const flight = validFlightOffers[i];
            const row = table.insertRow();
            const eurToUsdExchangeRate = 1.18; // Replace with the actual exchange rate
            const pricingInUSD = flight.price.total * eurToUsdExchangeRate;
>>>>>>> 7a2f6a4fa18526aa7ac50d079bc8667db9bedc24
            row.innerHTML = `
                <td>${calculateFlightDuration(flight.itineraries[0].segments[0].departure.at, flight.itineraries[0].segments[1].arrival.at)}</td>
                <td>${formatTime(flight.itineraries[0].segments[0].departure.at)}</td>
                <td>${formatTime(flight.itineraries[0].segments[1].arrival.at)}</td>
                <td>${pricingInUSD.toFixed(2)} USD</td>
                <td>${flight.itineraries[0].segments[0].carrierCode} Flight ${flight.itineraries[0].segments[0].number} (${flight.itineraries[0].segments[0].aircraft.code})</td>
                <td>${flight.itineraries[0].segments.length - 1}</td>
            `;
        }
<<<<<<< HEAD

=======
>>>>>>> 7a2f6a4fa18526aa7ac50d079bc8667db9bedc24
        flightOffersTable.appendChild(table);
    } else {
        flightOffersTable.textContent = "No flight offers found for the given criteria.";
    }
}

// Add an event listener for the flight offers form
document.getElementById("searchForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Prevent the form from submitting
    const city = d3.select("#destinationCity").property("value");
    console.log(city);
    if (city) {
        const openWeatherMapUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
        d3.json(openWeatherMapUrl).then(data => {
            displayWeather(data);
            displayMap(data.coord);
            fetchAndDisplayTemperatureForecast(city); // Fetch temperature forecast data
        });
    }

    const formData = new FormData(this);

    fetch("/get_flight_offers", {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error("Flight Offers API Error:", data.error);
        } else {
            displayFlightOffersData(data);
        }
    });
});

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

// Function to log the coordinates and assign them to variables
function logCoordinatesToConsole(coord) {
    console.log("Latitude:", coord.lat);
    console.log("Longitude:", coord.lon);
}

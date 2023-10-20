// Set your API key and units
let apiKey = "b94cd3922224f8eb48df6659b31b309b";
let units = "imperial"; // You can change to "metric" for Celsius

// Initialize the map
let map = L.map('map').setView([0, 0], 1);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Declare a variable to store the destination city
let destinationCity;

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

// Add an event listener for the flight offers form
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

// Function to display flight offer data in a table
function displayFlightOffersData(data) {
    // Get the element where you want to display the flight offers
    const flightOffersTable = document.getElementById("flightOffersTable");

    // Clear any previous data
    flightOffersTable.innerHTML = "";

    // Check if data is an array and not empty
    if (Array.isArray(data) && data.length > 0) {
        // Sort flight offers by duration in ascending order
        data.sort((a, b) => {
            const durationA = calculateFlightDuration(a.itineraries[0].segments[0].departure.at, a.itineraries[0].segments[1].arrival.at);
            const durationB = calculateFlightDuration(b.itineraries[0].segments[0].departure.at, b.itineraries[0].segments[1].arrival.at);
            return durationA.localeCompare(durationB);
        });

        // Create the flight offers table
        const table = document.createElement("table");
        table.classList.add("flight-offers-table");

        // Create table header
        const headerRow = table.insertRow();
        headerRow.innerHTML = `
            <th>Duration</th>
            <th>Departure Time</th>
            <th>Arrival Time</th>
            <th>Pricing</th>
            <th>Carrier Information</th>
            <th>Number of Stops</th>
        `;

        // Display the top 10 flight offers in the table
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const flight = data[i];
            const row = table.insertRow();

            // Calculate the pricing in USD using the exchange rate
            const eurToUsdExchangeRate = 1.18; // Replace with the actual exchange rate
            const pricingInUSD = flight.price.total * eurToUsdExchangeRate;

            row.innerHTML = `
                <td>${calculateFlightDuration(flight.itineraries[0].segments[0].departure.at, flight.itineraries[0].segments[1].arrival.at)}</td>
                <td>${formatTime(flight.itineraries[0].segments[0].departure.at)}</td>
                <td>${formatTime(flight.itineraries[0].segments[1].arrival.at)}</td>
                <td>${pricingInUSD.toFixed(2)} USD</td>
                <td>${flight.itineraries[0].segments[0].carrierCode} Flight ${flight.itineraries[0].segments[0].number} (${flight.itineraries[0].segments[0].aircraft.code})</td>
                <td>${flight.itineraries[0].segments.length - 1}</td>
            `;
        }

        // Append the table to the flightOffersTable container
        flightOffersTable.appendChild(table);
    } else {
        flightOffersTable.textContent = "No flight offers found for the given criteria.";
    }
}

// Add an event listener for the flight offers form
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


  

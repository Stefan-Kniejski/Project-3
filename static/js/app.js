let apiKey = "b94cd3922224f8eb48df6659b31b309b";
    let units = "imperial"; // You can change to "metric" for Celsius

    // Initialize the map
    let map = L.map('map').setView([0, 0], 1);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Listen for the button click event
    d3.select("#submit").on("click", function () {
        let city = d3.select("#destination").property("value");
        if (city) {
            let openWeatherMapUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
            d3.json(openWeatherMapUrl).then(data => {
                displayWeather(data);
                displayMap(data.coord);
            });
        }
    });

    // Function to display weather information
    function displayWeather(data) {
        let weatherInfo = d3.select("#weather-info");
        weatherInfo.html(""); // Clear previous data

        if (data.main && data.weather) {
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
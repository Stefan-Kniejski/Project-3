const apiKey = "b94cd3922224f8eb48df6659b31b309b",
  units = "imperial",
  map = L.map("map").setView([0, 0], 1);

let destinationCity;
let tempChart = null;
let currentUnit = "F";

// Results container that wraps all results (charts, maps, tables, etc.)
const resultsContainer = document.getElementById("results-container");

// Initially hide results container until a search is made
resultsContainer.style.display = "none";

function displayWeather(e) {
  const t = d3.select("#weather-info");
  t.html("");
  destinationCity = e.name;
  if (e.main && e.weather) {
    const a = e.main.temp,
      r = e.weather[0].description;
    t.append("p").text(`City: ${e.name}`);
    t.append("p").text(`Temperature: ${a} °F`);
    t.append("p").text(`Description: ${r}`);
  } else t.append("p").text("Weather data not found.");
}

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

function createUnifiedBarChart(labels, highTemps, lowTemps, unit) {
  const ctx = document.getElementById("temperature-chart").getContext("2d");
  if (tempChart) {
    tempChart.destroy();
  }
  tempChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `High Temp (°${unit})`,
          data: highTemps,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
        {
          label: `Low Temp (°${unit})`,
          data: lowTemps,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: `Temperature (°${unit})` },
        },
        x: { title: { display: true, text: "Date" } },
      },
      plugins: {
        title: { display: true, text: `5-Day Temperature Forecast (${unit})` },
      },
    },
  });
}

function fetchTemperatureForecast(city, unit = "imperial") {
  return fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`
  )
    .then((res) => res.json())
    .then((data) => {
      const dailyTemps = {};
      data.list.forEach((item) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyTemps[date]) dailyTemps[date] = { high: -Infinity, low: Infinity };
        dailyTemps[date].high = Math.max(dailyTemps[date].high, item.main.temp_max);
        dailyTemps[date].low = Math.min(dailyTemps[date].low, item.main.temp_min);
      });
      const labels = Object.keys(dailyTemps);
      const highTemps = labels.map((label) => dailyTemps[label].high);
      const lowTemps = labels.map((label) => dailyTemps[label].low);
      return { labels, highTemps, lowTemps };
    });
}

function updateTemperatureChart(city) {
  fetchTemperatureForecast(city, currentUnit === "F" ? "imperial" : "metric")
    .then(({ labels, highTemps, lowTemps }) => {
      createUnifiedBarChart(labels, highTemps, lowTemps, currentUnit);
    })
    .catch(console.error);
}

function fetchAndDisplayTemperatureForecast(city) {
  updateTemperatureChart(city);
}

function displayMap(coord) {
  map.setView([coord.lat, coord.lon], 10);
  let marker = L.marker([coord.lat, coord.lon]).addTo(map);
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}&units=imperial`;
  d3.json(url).then((data) => {
    if (data) marker.bindPopup(createWeatherPopupContent(data));
  });
}

function createWeatherPopupContent(data) {
  if (data.main && data.weather) {
    return `
            <p>City: ${data.name}</p>
            <p>Feels Like: ${data.main.feels_like} °F</p>
            <p>Humidity: ${data.main.humidity}%</p>
            <p>Pressure: ${data.main.pressure} hPa</p>
            <p>Description: ${data.weather[0].description}</p>
        `;
  }
  return "Weather data not found.";
}

function displayFlightOffersData(data) {
  const tableContainer = document.getElementById("flightOffersTable");
  tableContainer.innerHTML = "";

  if (Array.isArray(data) && data.length > 0) {
    const filtered = data.filter(
      (item) =>
        item.itineraries &&
        item.itineraries[0] &&
        item.itineraries[0].segments &&
        item.itineraries[0].segments[0] &&
        item.itineraries[0].segments[1]
    );

    filtered.sort((a, b) => {
      const durationA = calculateFlightDuration(
        a.itineraries[0].segments[0].departure.at,
        a.itineraries[0].segments[1].arrival.at
      );
      const durationB = calculateFlightDuration(
        b.itineraries[0].segments[0].departure.at,
        b.itineraries[0].segments[1].arrival.at
      );
      return durationA.localeCompare(durationB);
    });

    const table = document.createElement("table");
    table.classList.add("flight-offers-table");
    table.insertRow().innerHTML = `
            <th>Duration</th>
            <th>Departure Time</th>
            <th>Arrival Time</th>
            <th>Pricing (USD)</th>
            <th>Carrier Information</th>
            <th>Number of Stops</th>
        `;

    for (let i = 0; i < Math.min(filtered.length, 10); i++) {
      const offer = filtered[i];
      const priceUSD = offer.price.total * 1.18;
      const row = table.insertRow();
      row.innerHTML = `
                <td>${calculateFlightDuration(
                  offer.itineraries[0].segments[0].departure.at,
                  offer.itineraries[0].segments[1].arrival.at
                )}</td>
                <td>${formatTime(offer.itineraries[0].segments[0].departure.at)}</td>
                <td>${formatTime(offer.itineraries[0].segments[1].arrival.at)}</td>
                <td>${priceUSD.toFixed(2)} USD</td>
                <td>${offer.itineraries[0].segments[0].carrierCode} Flight ${
        offer.itineraries[0].segments[0].number
      } (${offer.itineraries[0].segments[0].aircraft.code})</td>
                <td>${offer.itineraries[0].segments.length - 1}</td>
            `;
    }
    tableContainer.appendChild(table);
  } else {
    tableContainer.textContent = "No flight offers found for the given criteria.";
  }
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleString();
}

function calculateFlightDuration(departure, arrival) {
  const start = new Date(departure),
    diff = new Date(arrival) - start;
  return `${Math.floor(diff / 3600000)}h ${Math.round((diff % 3600000) / 60000)}m`;
}

// Event listener: Search form submit
document.getElementById("searchForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const city = d3.select("#destinationCity").property("value");
  if (city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`;
    d3.json(url).then((data) => {
      displayWeather(data);
      displayMap(data.coord);
      fetchAndDisplayTemperatureForecast(city);
      // Show results container now that we have results
      resultsContainer.style.display = "block";
    });
  }

  const formData = new FormData(this);
  fetch("/get_flight_offers", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data) displayFlightOffersData(data);
    })
    .catch(console.error);
});

// Event listener: Reset button clears and hides results
document.getElementById("resetBtn").addEventListener("click", () => {
  // Reset the entire form
  document.getElementById("searchForm").reset();

  // Clear weather info
  d3.select("#weather-info").html("");

  // Clear flight offers table
  document.getElementById("flightOffersTable").innerHTML = "";

  // Clear temperature chart
  if (tempChart) {
    tempChart.destroy();
    tempChart = null;
  }

  // Hide results container
  resultsContainer.style.display = "none";

  // Remove all markers from the map (if you have references)
  map.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
});

document.getElementById("unit-select").addEventListener("change", function () {
  currentUnit = this.value;
  if (destinationCity) {
    updateTemperatureChart(destinationCity);
  }
});



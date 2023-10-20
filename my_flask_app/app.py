# INSTALLATION:
# You can install required packages using pip:
# pip install amadeus
# pip install sdk

from flask import Flask, render_template, request, jsonify
from amadeus import Client
import requests
import json
import csv

# Import the API keys from a config file
from config import amadeus_api_key, amadeus_api_secret, weather_api_key

app = Flask(__name__)

# Define the path to the CSV file containing city codes
csv_file = "../Resources/cityToCode.csv"

# Replace with your OpenWeatherMap API key
units = "imperial"  # You can change to "metric" for Celsius

# Amadeus Flight API
base_url = "https://test.api.amadeus.com/v2"

# Initialize the Amadeus client using API keys
amadeus = Client(client_id=amadeus_api_key, client_secret=amadeus_api_secret)

@app.route('/')
def index():
    # Render the HTML template for the main page
    return render_template('index.html')

@app.route('/get_weather', methods=['POST'])
def get_weather():
    city = request.form.get('city')

    if city:
        # Create the OpenWeatherMap API URL based on the provided city
        open_weather_map_url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={weather_api_key}&units={units}'
        
        # Send a GET request to OpenWeatherMap API
        response = requests.get(open_weather_map_url)
        data = response.json()

        # Return the weather data in JSON format
        return jsonify(data)
    else:
        # Return an error if the city is not provided
        return jsonify({'error': 'City not provided'})

@app.route('/get_flight_offers', methods=['POST'])
def get_flight_offers():
    origin_city = request.form.get('departureCity')
    destination_city = request.form.get('destinationCity')
    departure_date = request.form.get('departureDate')
    adults = request.form.get('adults')

    if origin_city and destination_city and departure_date and adults:
        # Get the airport codes for the origin and destination cities
        origin_code = get_airport_code(origin_city)
        destination_code = get_airport_code(destination_city)

        if origin_code and destination_code:
            # Fetch flight offers using Amadeus API
            print("FETCHING RESPONSE...")
            response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin_code,
                destinationLocationCode=destination_code,
                departureDate=departure_date,
                adults=int(adults)
            )
            print(f"RESPONSE: {response}")
            response_data = response.data
            data = json.dumps(response_data)

            # Return the flight offers data in JSON format
            return data
        else:
            # Return an error if origin or destination city is not found
            return jsonify({'error': 'Origin or destination city not found'})
    else:
        # Return an error if flight search criteria is incomplete
        return jsonify({'error': 'Incomplete flight search criteria'})

def get_airport_code(destination_city):
    # Read the city-to-code mapping from a CSV file
    with open(csv_file, mode="r", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row["City"].lower() == destination_city.lower().replace(" ", ""):
                code = row["Code"]
                return code
    
    # Print a message if the city is not found in the CSV file
    print("City not found in the CSV file")
    return None

if __name__ == '__main__':
    app.run(debug=True)

# INSTALLATION:
# pip install amadeus
# pip install sdk

from flask import Flask, render_template, request, jsonify
from amadeus import Client, ResponseError
import requests
import json
import csv
from urllib.parse import urlencode

app = Flask(__name__)

csv_file = "../Resources/cityToCode.csv"

# Replace with your OpenWeatherMap API key
api_key = "b94cd3922224f8eb48df6659b31b309b"
units = "imperial"  # You can change to "metric" for Celsius

# Amadeus Flight API
client_id = "GQioBSxIU0TIjk8NoVQ15YHYtHsnP6IJ"
client_secret = "kajo3AaR6WAYNA8q"
amadeus_api_key = "GQioBSxIU0TIjk8NoVQ15YHYtHsnP6IJ"
amadeus_api_secret = "kajo3AaR6WAYNA8q"
base_url = "https://test.api.amadeus.com/v2"

# Initialize the Amadeus client
amadeus = Client(client_id=amadeus_api_key, client_secret=amadeus_api_secret)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_weather', methods=['POST'])
def get_weather():
    city = request.form.get('city')

    if city:
        open_weather_map_url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units={units}'
        response = requests.get(open_weather_map_url)
        data = response.json()
        return jsonify(data)
    else:
        return jsonify({'error': 'City not provided'})

@app.route('/get_flight_offers', methods=['POST'])
def get_flight_offers():
    origin_city = request.form.get('departureCity')
    destination_city = request.form.get('destinationCity')
    departure_date = request.form.get('departureDate')
    adults = request.form.get('adults')

    if origin_city and destination_city and departure_date and adults:
        origin_code = get_airport_code(origin_city)
        destination_code = get_airport_code(destination_city)

        if origin_code and destination_code:
            response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin_code,
                destinationLocationCode=destination_code,
                departureDate=departure_date,
                adults=int(adults)
            )
            print(f"RESPONSE: {response}")
            response_data = response.data
            data = json.dumps(response_data)
            #print(f"DATA: {data}")
            return data
        else:
            return jsonify({'error': 'Origin or destination city not found'})
    else:
        return jsonify({'error': 'Incomplete flight search criteria'})

def get_airport_code(destination_city):
    with open(csv_file, mode="r", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row["City"].lower() == destination_city.lower():
                code = row["Code"]
                return code
    print("City not found in the CSV file")  
    return None

if __name__ == '__main__':
    app.run(debug=True)
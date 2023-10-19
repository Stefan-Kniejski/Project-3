from flask import Flask, render_template, request, jsonify
from amadeus import Client, ResponseError # pip install amadeus!!
import requests 
import csv

app = Flask(__name__)

csv_file = "../../../Resources/cityToCode.csv"

# Replace with your OpenWeatherMap API key
api_key = "b94cd3922224f8eb48df6659b31b309b"
units = "imperial"  # You can change to "metric" for Celsius

# Amadeus Flight API
amadeus_api_key = "GQioBSxIU0TIjk8NoVQ15YHYtHsnP6IJ"
amadeus_api_secret = "kajo3AaR6WAYNA8q"
base_url = "https://test.api.amadeus.com/v2"

# Initialize the Amadeus client
amadeus = Client(client_id=amadeus_api_key, client_secret=amadeus_api_secret)

################### ROUTES ###################################################

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_weather', methods=['POST'])
def get_weather():
    city = request.form['city']

    if city:
        open_weather_map_url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units={units}'
        response = requests.get(open_weather_map_url)
        data = response.json()
        return jsonify(data)
    else:
        return jsonify({'error': 'City not provided'})
    
# route for flight offers
@app.route('/get_flight_offers', methods=['POST'])
def get_flight_offers():
    departure_city = request.form['departureCity']
    destination_city = request.form['destinationCity']
    departure_date = request.form['departureDate']
    adults = int(request.form['adults'])

    if departure_city and destination_city and departure_date and adults:
        try:
            response = amadeus.shopping.flight_offers.get(
                originLocationCode=departure_city,
                destinationLocationCode=destination_city,
                departureDate=departure_date,
                adults=adults
            )
            return jsonify(response.data)
        except ResponseError as error:
            return jsonify({'error': str(error)})
    else:
        return jsonify({'error': 'Incomplete flight search criteria'})

###################### FUNCTIONS #############################################
    
# Function to search for the airport code based on the destination city
def get_airport_code(destination_city):
    with open(csv_file, mode="r", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row["City"].lower() == destination_city.lower():
                return row["Code"]
    return None  # Return None if the city is not found in the CSV file


if __name__ == '__main__':
    app.run(debug=True)


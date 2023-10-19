from flask import Flask, render_template, request, jsonify
from amadeus import Client, ResponseError
import requests
import csv
from urllib.parse import urlencode

app = Flask(__name__)

csv_file = "../Resources/cityToCode.csv"

# Replace with your OpenWeatherMap API key
api_key = "b94cd3922224f8eb48df6659b31b309b"
units = "imperial"  # You can change to "metric" for Celsius

# Amadeus Flight API
amadeus_api_key = "GQioBSxIU0TIjk8NoVQ15YHYtHsnP6IJ"
amadeus_api_secret = "kajo3AaR6WAYNA8q"
access_token = "LomTNkuEcc01OoZ1hJaZdaCzheBf"
base_url = "https://test.api.amadeus.com/v2"
headers = {
    "Authorization": f"Bearer {access_token}"
}

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
    print(f"{origin_city}, {destination_city}, {departure_date}, {adults}")

    if origin_city and destination_city and departure_date and adults:
        try:
            origin_code = get_airport_code(origin_city)
            destination_code = get_airport_code(destination_city)
            print(f"####### {origin_code} to {destination_code} #########")

            if origin_code and destination_code:
                amadeus_flight_offers_url = build_amadeus_flight_offers_url(origin_code, destination_code, departure_date, adults)
                response = requests.get(amadeus_flight_offers_url, headers=headers)
                
                # Check the response
                if response.status_code == 200:
                    data = response.json()
                    print(data)
                else:
                    print(f"Request failed with status code {response.status_code}: {response.text}")
                
                response_data = response.json()
                return jsonify(response_data)
            else:
                return jsonify({'error': 'Origin or destination city not found'})
        except Exception as e:
            return jsonify({'error': str(e)})
    else:
        return jsonify({'error': 'Incomplete flight search criteria'})

def build_amadeus_flight_offers_url(origin, destination, departure_date, adults):
    base_url = "https://test.api.amadeus.com/v2/shopping/flight-offers"
    params = {
        'originLocationCode': origin,
        'destinationLocationCode': destination,
        'departureDate': departure_date,
        'adults': adults,
        'nonStop': True,  # Set to True or False based on your search criteria
        'max': 250
    }

    print(f"INPUTS: {origin}, {destination}, {departure_date}, {adults}")
    # Use `urlencode` to encode the query parameters
    url = f"{base_url}?{urlencode(params)}"
    print(f"Amadeus URL: {url}")
    return url

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


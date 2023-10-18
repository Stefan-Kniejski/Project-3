from flask import Flask, render_template, request, jsonify
import requests 

app = Flask(__name__)

# Replace with your OpenWeatherMap API key
api_key = "b94cd3922224f8eb48df6659b31b309b"
units = "imperial"  # You can change to "metric" for Celsius

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

if __name__ == '__main__':
    app.run(debug=True)

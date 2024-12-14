from application import app
from flask_cors import CORS

CORS(app)
if __name__ == "__main__":
    print("Starting Flask server... Please wait.")
    app.run(debug=True, host='127.0.0.1', port=5000)
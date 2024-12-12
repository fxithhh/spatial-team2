import os
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask
from flask_pymongo import PyMongo

# Define the base directory (root of the project)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Construct the full path to the .env.local file
dotenv_path = BASE_DIR / '.env.local'

# Load environment variables from .env.local
load_dotenv(dotenv_path=dotenv_path)

# Initialize Flask app
app = Flask(__name__)

# Set configuration variables from environment
app.config["API_KEY"] = os.getenv("API_KEY")
app.config["MONGO_URI"] = os.getenv("MONGO_URI")

# Setup MongoDB
mongo = PyMongo(app)
db = mongo.db

try:
    mongo.init_app(app)
    mongo.db.command("ping")
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")

from application import routes

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000, debug=False)

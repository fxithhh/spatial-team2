from flask import Flask
import os
from dotenv import load_dotenv
from flask_pymongo import PyMongo

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["MONGO_URI"] = os.getenv("MONGO_URI")

#setup MongoDB

mongo= PyMongo(app)
db = mongo.db

try:
    mongo.init_app(app)
    mongo.db.command("ping")
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")

from application import routes

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000, debug=True)

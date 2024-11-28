# __init__.py
from flask import Flask
from flask_pymongo import PyMongo

app = Flask(__name__)
app.config["SECRET_KEY"] = "a5280e13490126820776e787fe147399bc7d48b0"
app.config["MONGO_URI"] = "mongodb+srv://btonyip:Kbd0PvJSa6yL0Ui7@spatialcluster.tbvav.mongodb.net/spatial?retryWrites=true&w=majority&appName=SpatialCluster"

#setup MongoDB

mongo= PyMongo(app)
db = mongo.db

try:
    mongo.init_app(app)  # Initialize with the app context
    mongo.db.command("ping")  # Ping the database to check the connection
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")

from application import routes
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000, debug=True)
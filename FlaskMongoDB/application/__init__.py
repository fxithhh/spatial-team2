from flask import Flask
from flask_pymongo import PyMongo

app = Flask(__name__)
app.config["SECRET_KEY"] = "a5280e13490126820776e787fe147399bc7d48b0"
app.config["MONGO_URI"] = "mongodb+srv://btonyip:<j0q1khVkq7xHgFLW>@spatialcluster.tbvav.mongodb.net/?retryWrites=true&w=majority&appName=SpatialCluster"

#setup MongoDB

mongodb_client = PyMongo(app)
db = mongodb_client.db

from application import routes
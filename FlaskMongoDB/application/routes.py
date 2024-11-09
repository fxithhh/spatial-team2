from application import app, mongo, db
from flask import render_template, request, jsonify
from flask_cors import CORS
import json
from bson import ObjectId

CORS(app)

# Home route to render the HTML form
@app.route("/")
def home():
    return render_template("layout.html")

# Route to handle JSON file upload and store it in MongoDB
@app.route("/upload_json", methods=["POST"])
def upload_json():
    if "jsonFile" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files["jsonFile"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if file and file.filename.endswith(".json"):
        data = json.load(file)  # Load the JSON file data
        # Insert JSON data into MongoDB
        result = mongo.db.Artworks.insert_one(data)  # Replace `Artworks` with your collection name
        return jsonify({"message": "JSON file uploaded successfully", "id": str(result.inserted_id)})
    
    return jsonify({"error": "Invalid file format; please upload a JSON file"}), 400

# CRUD Operations

# Create: Add new JSON data entry to the MongoDB collection
@app.route("/add_json", methods=["POST"])
def add_json():
    new_data = request.get_json()
    if new_data:
        result = mongo.db.Artworks.insert_one(new_data)
        return jsonify({"message": "Data added successfully", "id": str(result.inserted_id)})
    return jsonify({"error": "No data provided"}), 400

# Read: Get all JSON entries from MongoDB
@app.route("/get_json", methods=["GET"])
def get_json():
    data = list(mongo.db.Artworks.find())
    # Convert ObjectIds to strings for JSON serialization
    for item in data:
        item["_id"] = str(item["_id"])
    return jsonify(data)

# Update: Modify an entry in the MongoDB collection by ID
@app.route("/update_json/<id>", methods=["PUT"])
def update_json(id):
    update_data = request.get_json()
    if update_data:
        result = mongo.db.Artworks.update_one({"_id": ObjectId(id)}, {"$set": update_data})
        if result.matched_count:
            return jsonify({"message": "Data updated successfully"})
        else:
            return jsonify({"error": "Data with specified ID not found"}), 404
    return jsonify({"error": "No data provided for update"}), 400

# Delete: Remove an entry from the MongoDB collection by ID
@app.route("/delete_json/<id>", methods=["DELETE"])
def delete_json(id):
    result = mongo.db.Artworks.delete_one({"_id": ObjectId(id)})
    if result.deleted_count:
        return jsonify({"message": "Data deleted successfully"})
    else:
        return jsonify({"error": "Data with specified ID not found"}), 404

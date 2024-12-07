from application import app, mongo, db
from flask import request, jsonify, Blueprint, render_template, redirect
from dotenv import load_dotenv
import os
import json, base64
from bson import ObjectId
from pymongo import MongoClient
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")
#import the func from openai_api.py
from .openai_api import generate_response_conservation, tax_template, generate_taxonomy_tags,generate_visual_context, convert_image_to_jpeg, load_vectorstore_from_mongo

api = Blueprint('api', __name__)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.spatial

artworks_collection = db.Artworks
taxonomy_artworks_collection = db.TaxonomyArtworks

# Home route to render the HTML form
@app.route("/")
def home():
    return redirect('/view_graph')

@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

# Route to handle JSON file upload and store it in MongoDB
@app.route("/upload_json", methods=["POST"])
def upload_json():
    # Check if the request is JSON
    if not request.is_json:
        print("Debug: Request is not JSON.")
        return jsonify({"error": "Request must be a JSON object"}), 400

    try:
        # Parse the incoming JSON
        original_metadata = request.get_json()
        print("Debug: Received JSON data:", original_metadata)

        # Extract and process image data
        image_data = original_metadata.get("image")
        if image_data:
            try:
                print("Debug: Processing image data.")
                base64_data = image_data.split(",")[1] if "," in image_data else image_data
                image_binary = base64.b64decode(base64_data, validate=True)
                print("Debug: Image data decoded successfully.")

                # Convert to JPEG
                compressed_image = convert_image_to_jpeg(image_binary)
                if compressed_image is None:
                    raise ValueError("Image conversion failed.")
                print("Debug: Image successfully converted to JPEG.")

                # Encode back to Base64
                compressed_image_base64 = base64.b64encode(compressed_image).decode("utf-8")
                print("Debug: Image re-encoded to Base64.")
            except Exception as e:
                print(f"Debug: Image processing error: {e}")
                return jsonify({"error": "Invalid image data or conversion failed"}), 400
        else:
            print("Debug: No image data provided.")
            compressed_image_base64 = None

        # Prepare metadata without the image
        metadata_without_image = {key: value for key, value in original_metadata.items() if key != "image"}
        print("Debug: Metadata without image:", metadata_without_image)
        print(f"API_KEY: {'Set' if API_KEY else 'Not Set'}: {API_KEY[:4]}****{API_KEY[-4:]}" if API_KEY else "API_KEY is Not Set")

        # Generate conservation feedback
        try:
            print("Debug: Generating conservation feedback.")
            vectorstore = load_vectorstore_from_mongo()
            print("Debug: Vectorstore loaded successfully.")
            openai_feedback = generate_response_conservation(
                metadata=metadata_without_image,
                vectorstore=vectorstore,
                model="gpt-4o"
            )
            print("Debug: OpenAI conservation feedback received:", openai_feedback)
        except Exception as e:
            print(f"Debug: OpenAI API error (conservation): {e}")
            return jsonify({"error": "Failed to process data with OpenAI for conservation feedback"}), 500

        # Generate taxonomy feedback if image data is present
        if image_data:
            try:
                print("Debug: Generating taxonomy feedback.")
                taxonomy_feedback = generate_taxonomy_tags(
                    metadata=metadata_without_image,
                    image_data=compressed_image_base64,
                    tax_template=tax_template,
                    model="gpt-4o"
                )
                print("Debug: OpenAI taxonomy feedback received:", taxonomy_feedback)
            except Exception as e:
                print(f"Debug: OpenAI API error (taxonomy): {e}")
                return jsonify({"error": "Failed to process data with OpenAI for taxonomy feedback"}), 500
        else:
            print("Debug: Skipping taxonomy feedback generation (no image data).")
            taxonomy_feedback = None
        
          # Generate visual_context if image data is present
        if image_data:
            try:
                print("Debug: Generating Visual Context.")
                visual_context = generate_visual_context(
                    metadata=metadata_without_image,
                    image_data=compressed_image_base64,
                    tax_template=tax_template,
                    model="gpt-4o"
                )
                print("Debug: OpenAI visual context received:", visual_context)
            except Exception as e:
                print(f"Debug: OpenAI API error (taxonomy): {e}")
                return jsonify({"error": "Failed to process data with OpenAI for visual context"}), 500
        else:
            print("Debug: Skipping taxonomy feedback generation (no image data).")
            taxonomy_feedback = None

        # Combine data for MongoDB insertion
        combined_data = {
            **original_metadata,
            "openai_feedback": openai_feedback,
            "taxonomy_feedback": taxonomy_feedback,
            "visual_context": visual_context
        }
        print("Debug: Combined data prepared for MongoDB:", combined_data)

        # Insert into MongoDB
        try:
            print("Debug: Inserting data into MongoDB.")
            insertion_result = artworks_collection.insert_one(combined_data)
            inserted_id = str(insertion_result.inserted_id)
            print("Debug: Data inserted successfully with ID:", inserted_id)
        except Exception as e:
            print(f"Debug: MongoDB insertion error: {e}")
            return jsonify({"error": "Failed to insert data into MongoDB"}), 500

        # Return success response
        print("Debug: Returning success response.")
        return jsonify({
            "message": "Artwork uploaded and processed successfully",
            "artwork_id": inserted_id,
            "openai_feedback": openai_feedback,
            "taxonomy_feedback": taxonomy_feedback,
            "visual_context": visual_context
        }), 200

    except Exception as e:
        print(f"Debug: Unexpected error: {e}")
        return jsonify({"error": "Failed to process JSON object"}), 500

@app.route("/view_graph")
def view_graph():
    """
    Serves the interactive graph visualization HTML page.
    """
    return render_template("artworks_graph_with_sliders.html")

# New Route to Get Graph Data (if not already added)
@app.route("/get_graph", methods=["GET"])
def get_graph():
    """
    Retrieves the latest graph data from MongoDB and returns it as JSON.
    """
    graph_data = db['ArtworksGraph'].find_one(sort=[('created_at', -1)])
    if graph_data:
        graph_data["_id"] = str(graph_data["_id"])  # Convert ObjectId to string
        return jsonify(graph_data["graph"])
    else:
        return jsonify({"error": "Graph data not found"}), 404

# Ensure that the Flask app runs only when executed directly
if __name__ == "__main__":
    app.run(debug=True)

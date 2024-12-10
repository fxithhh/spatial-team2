from application import app, mongo, db
from flask import request, jsonify, Blueprint, render_template, redirect
from dotenv import load_dotenv
import os
import json, base64
from bson import ObjectId
from pymongo import MongoClient
load_dotenv()
from io import BytesIO

MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")
#import the func from openai_api.py
from .openai_api import generate_response_conservation, tax_template, generate_taxonomy_tags,generate_visual_context, convert_image_to_jpeg, load_vectorstore_from_mongo
from .read_excel import process_excel_file

api = Blueprint('api', __name__)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.spatial

artworks_collection = db.Artworks
taxonomy_artworks_collection = db.TaxonomyArtworks
create_exhibits = db.Bulkuploads

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

@app.route("/bulk_upload", methods=["POST"])
def bulk_upload():
    try:
        # Debug incoming form data and files
        print("Incoming form data:", request.form.to_dict())
        print("Incoming files:", list(request.files.keys()))

        # Extract form data
        exhibit_title = request.form.get("exhibit_title")
        concept = request.form.get("concept")
        subsections = request.form.getlist("subsections")  # Extract as list

        if not exhibit_title or not concept:
            print("Missing required form data: 'exhibit_title' or 'concept'")
            return jsonify({"error": "Missing required form data: 'exhibit_title' or 'concept'"}), 400

        form_data = {
            "exhibit_title": exhibit_title,
            "concept": concept,
            "subsections": subsections,
        }

        # Debug extracted form data
        print("Extracted form data:", form_data)

        # Process images
        images = {}
        for key, file in request.files.items():
            try:
                print(f"Processing file: {file.filename} (key: {key}, type: {file.content_type})")
                if key != "artwork_list" and file.content_type.startswith("image/"):
                    images[key] = handle_image_upload(file)
                    print(f"Image {file.filename} processed successfully.")
            except Exception as e:
                print(f"Error processing image {key}: {str(e)}")
                return jsonify({"error": f"Error processing image '{key}': {str(e)}"}), 400

        form_data["images"] = images
        print("Processed images:", images.keys())

        # Process the Excel file
        if "artwork_list" in request.files:
            try:
                artwork_file = request.files["artwork_list"]
                print(f"Processing Excel file: {artwork_file.filename}")
                processed_data = process_excel_file(artwork_file)
                print("Debug: Processed data:", processed_data)

                # Validate processed_data structure
                if "data" not in processed_data or "images" not in processed_data:
                    print("Debug: Missing 'data' or 'images' in processed_data.")
                    return jsonify({"error": "Invalid data structure returned from Excel processing."}), 400

                form_data["artworks"] = processed_data["data"]
                form_data["excel_images"] = processed_data["images"]

                print(f"Excel file {artwork_file.filename} processed successfully.")
            except Exception as e:
                print(f"Error processing artwork Excel file: {str(e)}")
                return jsonify({"error": f"Error processing artwork Excel file: {str(e)}"}), 400

            form_data["artworks"] = processed_data["data"]
            form_data["excel_images"] = processed_data["images"]

            for idx, row in enumerate(processed_data["data"]):
                try:
                    print(f"Calling OpenAI API for row {idx}")
                    
                    # Get the image data
                    embedded_image = row.get("embedded_image", "")
                    if not embedded_image:
                        print(f"No embedded image for row {idx}. Skipping row.")
                        row["error"] = "No embedded image."
                        continue

                    # Convert to JPEG format
                    embedded_image = convert_image_to_jpeg(embedded_image, return_base64=True)
                    if not embedded_image:
                        print(f"Failed to convert image to JPEG for row {idx}.")
                        row["error"] = "Image conversion to JPEG failed."
                        continue

                    # Debug: Log the image being sent to GPT
                    print(f"Debug: Row {idx} image being sent to GPT: {embedded_image[:50]}... (truncated)")

                    # Call OpenAI APIs
                    row["conservation_guidelines"] = generate_response_conservation(row)
                    row["taxonomy_tags"] = generate_taxonomy_tags(row, embedded_image, {}, "gpt-4o")
                    row["visual_context"] = generate_visual_context(row, embedded_image, {}, "gpt-4o")
                    print(f"OpenAI metadata generated for row {idx}")
                except Exception as e:
                    print(f"Error generating OpenAI metadata for row {idx}: {str(e)}")
                    row["error"] = f"OpenAI metadata generation failed: {str(e)}"
                    
        # Insert the form data into MongoDB
        try:
            print("Inserting data into MongoDB...")
            result = create_exhibits.insert_one(form_data)
            form_data["_id"] = str(result.inserted_id)
            print(f"Data inserted into MongoDB with ID: {form_data['_id']}")
        except Exception as e:
            print("Error inserting data into MongoDB:", str(e))
            return jsonify({"error": "Failed to save data to MongoDB"}), 500

        # Return success response
        return jsonify({
            "message": "Form submitted successfully",
            "data": form_data,
        }), 201

    except Exception as e:
        # Catch all unexpected errors
        print("Unexpected error:", str(e))
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500


@app.route('/api/exhibit/<string:exhibit_id>', methods=['GET'])
def get_exhibit(exhibit_id):
    try:
        # Fetch exhibit data by _id
        exhibit = create_exhibits.find_one({"_id": exhibit_id})
        if not exhibit:
            return jsonify({"error": "Exhibit not found"}), 404
        
        # Convert MongoDB ObjectId to string (if needed)
        exhibit["_id"] = str(exhibit["_id"])
        
        # Return the exhibit data as JSON
        return jsonify(exhibit), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Internal server error"}), 500

# Helper: Handle image uploads
def handle_image_upload(file):
    """Converts an image to Base64."""
    try:
        image_binary = file.read()
        return base64.b64encode(image_binary).decode("utf-8")
    except Exception:
        raise ValueError("Invalid image file")

def is_valid_base64(data):
    try:
        base64.b64decode(data, validate=True)
        return True
    except Exception:
        return False



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

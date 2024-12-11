from .openai_api import generate_response_conservation, tax_template, generate_taxonomy_tags, generate_visual_context, load_vectorstore_from_mongo
from .read_excel import process_excel_file
from io import BytesIO
from application import app, mongo, db
from flask import request, jsonify, Blueprint, render_template, redirect
from dotenv import load_dotenv
import os
import json
import base64
from bson import ObjectId
from pymongo import MongoClient
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")
# import the func from openai_api.py

api = Blueprint('api', __name__)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.spatial

artworks_collection = db.Artworks
taxonomy_artworks_collection = db.TaxonomyArtworks
create_exhibits = db.Exhibits

# Home route to render the HTML form


@app.route("/")
def home():
    return redirect('/view_graph')


@app.route('/favicon.ico')
def favicon():
    return app.send_static_file('favicon.ico')

# Route to handle JSON file upload and store it in MongoDB
@app.route("/add_artwork", methods=["POST"])
def add_artwork():
    # Check if the request is JSON
    if not request.is_json:
        return jsonify({"error": "Request must be a JSON object"}), 400

    try:
        # Parse the incoming JSON
        original_metadata = request.get_json()
        exhibition_id = original_metadata.get("exhibition_id")
        if not exhibition_id:
            return jsonify({"error": "Exhibition ID is required"}), 400
        
        try:
            exhibition = create_exhibits.find_one({"_id": ObjectId(exhibition_id)})
            if not exhibition:
                return jsonify({"error": "Invalid exhibition ID"}), 400
        except Exception:
            return jsonify({"error": "Invalid exhibition ID format"}), 400

        # Extract and process image data
        image_data = original_metadata.get("image")
        if image_data:
            try:
                base64_data = image_data.split(",")[1] if "," in image_data else image_data
                image_binary = base64.b64decode(base64_data, validate=True)

                # Convert to JPEG
                compressed_image = convert_image_to_jpeg(image_binary)
                if compressed_image is None:
                    raise ValueError("Image conversion failed.")

                # Encode back to Base64
                compressed_image_base64 = base64.b64encode(compressed_image).decode("utf-8")
            except Exception:
                return jsonify({"error": "Invalid image data or conversion failed"}), 400
        else:
            compressed_image_base64 = None

        # Prepare metadata without the image
        metadata_without_image = {key: value for key, value in original_metadata.items() if key != "image"}

        # Generate conservation feedback
        try:
            vectorstore = load_vectorstore_from_mongo()
            openai_feedback = generate_response_conservation(
                metadata=metadata_without_image,
                vectorstore=vectorstore,
                model="gpt-4o"
            )
        except Exception:
            return jsonify({"error": "Failed to process data with OpenAI for conservation feedback"}), 500

        # Generate taxonomy feedback if image data is present
        if image_data:
            try:
                taxonomy_feedback = generate_taxonomy_tags(
                    metadata=metadata_without_image,
                    image_data=compressed_image_base64,
                    tax_template=tax_template,
                    model="gpt-4o"
                )
            except Exception:
                return jsonify({"error": "Failed to process data with OpenAI for taxonomy feedback"}), 500
        else:
            taxonomy_feedback = None
        
        # Generate visual_context if image data is present
        if image_data:
            try:
                visual_context = generate_visual_context(
                    metadata=metadata_without_image,
                    image_data=compressed_image_base64,
                    tax_template=tax_template,
                    model="gpt-4o"
                )
            except Exception:
                return jsonify({"error": "Failed to process data with OpenAI for visual context"}), 500
        else:
            taxonomy_feedback = None

        # Combine data for MongoDB insertion
        combined_data = {
            **original_metadata,
            "openai_feedback": openai_feedback,
            "taxonomy_feedback": taxonomy_feedback,
            "visual_context": visual_context,
            "exhibition_id": exhibition_id
        }

        # Insert into MongoDB
        try:
            insertion_result = artworks_collection.insert_one(combined_data)
            inserted_id = str(insertion_result.inserted_id)
        except Exception:
            return jsonify({"error": "Failed to insert data into MongoDB"}), 500
        
        try:
            create_exhibits.update_one(
                {"_id": ObjectId(exhibition_id)},
                {"$push": {"artworks": inserted_id}}
            )
        except Exception:
            return jsonify({"error": "Failed to link artwork to exhibition"}), 500

        # Return success response
        return jsonify({
            "message": "Artwork uploaded and processed successfully",
            "artwork_id": inserted_id,
            "openai_feedback": openai_feedback,
            "taxonomy_feedback": taxonomy_feedback,
            "visual_context": visual_context
        }), 200

    except Exception:
        return jsonify({"error": "Failed to process JSON object"}), 500


@app.route("/create_exhibit", methods=["POST"])
def create_exhibit():
    try:
        # Debug incoming form data and files
        print("Incoming form data:", request.form.to_dict())
        print("Incoming files:", list(request.files.keys()))

        # Extract form data
        exhibit_title = request.form.get("exhibit_title")
        concept = request.form.get("concept")
        subsections = request.form.getlist("subsections")

        if not exhibit_title or not concept:
            return jsonify({"error": "Missing required form data: 'exhibit_title' or 'concept'"}), 400

        form_data = {
            "exhibit_title": exhibit_title,
            "concept": concept,
            "subsections": subsections,
        }

        # Process the Excel file
        if "artwork_list" not in request.files:
            return jsonify({"error": "Missing artwork Excel file."}), 400

        try:
            artwork_file = request.files["artwork_list"]
            print(f"Processing Excel file: {artwork_file.filename}")
            processed_data = process_excel_file(artwork_file)

            if "data" not in processed_data or "images" not in processed_data:
                return jsonify({"error": "Invalid data structure from Excel processing."}), 400

            form_data["artworks"] = processed_data["data"]
            form_data["excel_images"] = processed_data["images"]

            print(f"Excel file {artwork_file.filename} processed successfully.")
        except Exception as e:
            return jsonify({"error": f"Error processing artwork Excel file: {str(e)}"}), 400
        
        # Validate and process the images
        valid_images = []
        for idx, image in enumerate(processed_data["images"]):
            try:
                print(f"Validating image {idx}")
                
                # Validate Base64 string
                if not is_valid_base64(image):
                    raise ValueError(f"Image {idx} is not a valid Base64 string.")

                valid_images.append(image)
                print(f"Image {idx} validated and processed successfully.")

            except Exception as e:
                print(f"Error processing image {idx}: {str(e)}")

        # Run OpenAI functions on the extracted rows
        for idx, row in enumerate(form_data["artworks"]):
            try:
                print(f"Calling OpenAI API for row {idx}")
                # Use the validated image for this row
                image_for_row = valid_images[idx] if idx < len(valid_images) else None
                if not image_for_row:
                    raise ValueError(f"No valid image for row {idx}. Skipping OpenAI API call.")

                # Validate metadata
                metadata = row
                if not isinstance(metadata, dict):
                    raise ValueError(f"Invalid metadata for row {idx}.")

                row["conservation_guidelines"] = generate_response_conservation(row)
                row["taxonomy_tags"] = generate_taxonomy_tags(row, image_for_row, {}, "gpt-4o")
                row["visual_context"] = generate_visual_context(row,image_for_row, {}, "gpt-4o")
                print(f"OpenAI metadata generated for row {idx}")
            except Exception as e:
                print(f"Error generating OpenAI metadata for row {idx}: {str(e)}")
                row["error"] = f"OpenAI metadata generation failed: {str(e)}"

        # Insert the complete form data into MongoDB
        try:
            print("Inserting data into MongoDB...")
            result = create_exhibits.insert_one(form_data)
            form_data["_id"] = str(result.inserted_id)
            print(f"Data inserted into MongoDB with ID: {form_data['_id']}")
        except Exception as e:
            return jsonify({"error": "Failed to save data to MongoDB"}), 500

        # Return success response
        return jsonify({
            "message": "Form submitted successfully",
            "data": form_data,
            "exhibitId": str(result.inserted_id),
        }), 201

    except Exception as e:
        print("Unexpected error:", str(e))
        return jsonify({"error": "Internal server error"}), 500


@app.route('/exhibits', methods=['GET'])
@app.route('/exhibits/<id>', methods=['GET'])
def get_exhibits(id=None):
    try:
        if id:
            # Fetch the exhibit with the given ID
            exhibit = create_exhibits.find_one({"_id": ObjectId(id)})

            if not exhibit:
                return jsonify({"error": "Exhibit not found"}), 404

            # Process the exhibit fields
            exhibit["_id"] = str(exhibit["_id"])
            exhibit["artworks"] = [
                {
                    "title": artwork.get("Artwork Title", "Untitled Artwork"),
                    "description": artwork.get("Artwork Description ", "No Description"),
                    "artist": artwork.get("Artist Name", "Unknown Artist"),
                    "dating": artwork.get(" Dating", "Unknown Date"),
                    "dimension": artwork.get("Dimension", "Unknown Dimensions"),
                    "material": artwork.get("Material", "Unknown Material"),
                    "display_type": artwork.get("Display Type", "N/A"),
                    "geographical_association": artwork.get("Geographical Association ", "N/A"),
                    "acquisition_type": artwork.get("Acquisition Type ", "N/A"),
                    "historical_significance": artwork.get("Historical Significance", "N/A"),
                    "style_significance": artwork.get("Style Significance", "N/A"),
                    "exhibition_utilization": artwork.get("Exhibition Utilisation ", "N/A"),
                    "conservation_guidelines": artwork.get("conservation_guidelines", {}).get("Conservation_Guidelines", "N/A"),
                    "taxonomy": {
                        "Artist": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Artist", "Unknown"),
                        "Title": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Title", "Untitled"),
                        "Dating": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Dating", "Unknown Year"),
                        "Material": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Material", []),
                        "Geographical Association": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Geographical Association", "Unknown"),
                        "Acquisition Type": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Acquisition Type", "Unknown"),
                        "Display Type": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Display Type", "Unknown"),
                        "Exhibition Utilisation": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Exhibition Utilisation", "Unknown"),
                        "Style Significance": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Style Significance", []),
                        "Historical Significance": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Historical Significance", []),
                        "Conservation Guidelines": artwork.get("taxonomy_tags", {}).get("tags", {}).get("Conservation Guidelines", []),
                        },
                    "visual_context": artwork.get("visual_context", []),
                    "image": f"data:image/;base64,{artwork.get('excel_images', '')}"
                }
                for artwork in exhibit.get("artworks", [])
            ]

            return jsonify(exhibit), 200
        else:
            # Fetch all exhibits from the MongoDB collection
            exhibits_cursor = create_exhibits.find()

            # Convert the MongoDB cursor to a list of dictionaries
            exhibits = []
            for exhibit in exhibits_cursor:
                exhibit["_id"] = str(exhibit["_id"])  # Convert ObjectId to string for JSON serialization

                # Extract relevant fields
                title = exhibit.get("exhibit_title", "Untitled Exhibit")
                concept = exhibit.get("concept", "")
                subsections = exhibit.get("subsections", [])
                images = exhibit.get("images", {})
                floor_plan = images.get("floor_plan", None)

                # Ensure floor_plan includes Base64 prefix if missing
                if floor_plan and not floor_plan.startswith("data:image"):
                    floor_plan = f"data:image/png;base64,{floor_plan}"

                artworks = [
                    {
                        "title": artwork.get("Artwork Title", "Untitled Artwork"),
                        "artist": artwork.get("Artist Name", "Unknown Artist"),
                        "dimension": artwork.get("Dimension", "Unknown Dimensions"),
                    }
                    for artwork in exhibit.get("artworks", [])
                ]

                # Append processed exhibit to the list
                exhibits.append({
                    "_id": exhibit["_id"],
                    "exhibit_title": title,
                    "concept": concept,
                    "subsections": subsections,
                    "floor_plan": floor_plan,
                    "artworks": artworks,
                })

            # If no exhibits are found, return an appropriate message
            if not exhibits:
                return jsonify({"error": "No exhibits found"}), 404


            # Return the list of exhibits as JSON
            return jsonify(exhibits), 200

    except Exception as e:
        print(f"Error fetching exhibits: {e}")
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
        # Convert ObjectId to string
        graph_data["_id"] = str(graph_data["_id"])
        return jsonify(graph_data["graph"])
    else:
        return jsonify({"error": "Graph data not found"}), 404


# Ensure that the Flask app runs only when executed directly
if __name__ == "__main__":
    app.run(debug=True)

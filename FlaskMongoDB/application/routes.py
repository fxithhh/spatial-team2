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


@app.route("/add_artwork", methods=["POST"])
def add_artwork():
    # Check if the request is JSON
    if not request.is_json:
        return jsonify({"error": "Request must be a JSON object"}), 400

    try:
        # Parse the incoming JSON
        original_metadata = request.get_json()

        # Validate and fetch the exhibition ID
        exhibition_id = original_metadata.get("exhibition_id")
        if not exhibition_id:
            return jsonify({"error": "Exhibition ID is required"}), 400

        # Fetch the exhibition data from the database
        try:
            exhibition = create_exhibits.find_one({"_id": ObjectId(exhibition_id)})
            if not exhibition:
                return jsonify({"error": "Invalid exhibition ID"}), 400
        except Exception:
            return jsonify({"error": "Invalid exhibition ID format"}), 400

        # Extract exhibit_info from the fetched exhibition
        exhibit_title = exhibition.get("title", "Untitled Exhibit")
        concept = exhibition.get("concept", "No concept available")
        subsections = exhibition.get("subsections", [])
        exhibit_info = {
            "exhibit_title": exhibit_title,
            "concept": concept,
            "subsections": subsections,
        }

        # Extract and validate image data
        image_data = original_metadata.get("image")
        if image_data:
            try:
                base64_data = image_data.split(",")[1] if "," in image_data else image_data
                base64.b64decode(base64_data, validate=True)  # Ensure valid Base64 data
            except Exception:
                return jsonify({"error": "Invalid image data"}), 400
        else:
            image_data = None

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
        except Exception as e:
            return jsonify({"error": f"Failed to process conservation feedback: {str(e)}"}), 500

        # Generate taxonomy feedback if image data is present
        taxonomy_feedback = None
        if image_data:
            try:
                taxonomy_feedback = generate_taxonomy_tags(
                    metadata=metadata_without_image,
                    image_data=image_data,
                    exhibit_info=exhibit_info,
                    model="gpt-4o"
                )
            except Exception as e:
                return jsonify({"error": f"Failed to process taxonomy feedback: {str(e)}"}), 500

        # Generate visual context if image data is present
        visual_context = None
        if image_data:
            try:
                visual_context = generate_visual_context(
                    metadata=metadata_without_image,
                    image_data=image_data,
                    tax_template=tax_template,
                    model="gpt-4o"
                )
            except Exception as e:
                return jsonify({"error": f"Failed to process visual context: {str(e)}"}), 500

        # Prepare new artwork data
        new_artwork = {
            **metadata_without_image,
            "openai_feedback": openai_feedback,
            "taxonomy_feedback": taxonomy_feedback,
            "visual_context": visual_context
        }
        # Prepared new artwork data

        # Update MongoDB: Add new artwork and image to separate fields
        try:
            # Updating MongoDB with new artwork and image
            create_exhibits.update_one(
                {"_id": ObjectId(exhibition_id)},
                {
                    "$push": {"artworks": new_artwork},  # Add to artworks array
                    "$addToSet": {"Excel_images": image_data}  # Add image to Excel_images field
                }
            )
            # Artwork and image successfully added to MongoDB
        except Exception as e:
            # Error updating MongoDB
            return jsonify({"error": f"Failed to update exhibition with artwork and image: {str(e)}"}), 500

        # Return success response
        # Returning success response
        return jsonify({
            "message": "Artwork uploaded and processed successfully",
            "artwork_data": new_artwork,
            "image_stored": image_data is not None,
            "openai_feedback": openai_feedback,
            "taxonomy_feedback": taxonomy_feedback,
            "visual_context": visual_context
        }), 200

    except Exception as e:
        # An unexpected error occurred
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


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
        floor_plan_file = request.files.get("floor_plan")
        if floor_plan_file:
            # Read file content and encode it as Base64
            floor_plan_binary = floor_plan_file.read()
            floor_plan_base64 = base64.b64encode(floor_plan_binary).decode('utf-8')  # Convert to string
        else:
            return jsonify({"error": "Floor plan file is missing."}), 400

        if not exhibit_title or not concept:
            return jsonify({"error": "Missing required form data: 'exhibit_title' or 'concept'"}), 400

        form_data = {
            "exhibit_title": exhibit_title,
            "concept": concept,
            "subsections": subsections,
            "floor_plan": floor_plan_base64,
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

        exhibit_info = {
            "exhibit_title": exhibit_title,
            "concept": concept,
            "subsections": subsections,
            "floor_plan" : floor_plan_file,
        }

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
                row["visual_context"] = generate_visual_context(row,image_for_row, {}, "gpt-4o")
                row["conservation_guidelines"] = generate_response_conservation(row)
                row["taxonomy_tags"] = generate_taxonomy_tags(row, image_for_row,exhibit_info, "gpt-4o")
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


@app.route('/exhibits', defaults={'id': None}, methods=['GET'])
@app.route('/exhibits/<id>', methods=['GET'])
def get_exhibits(id):
    try:
        if id:
            # Fetch a single exhibit
            exhibit = create_exhibits.find_one({"_id": ObjectId(id)})
            if not exhibit:
                return jsonify({"error": "Exhibit not found"}), 404

            # Process and return the single exhibit
            exhibit = process_exhibit(exhibit)
            return jsonify(exhibit), 200

        else:
            # Fetch all exhibits
            exhibits_cursor = create_exhibits.find()
            exhibits = [process_exhibit(exhibit) for exhibit in exhibits_cursor]

            if not exhibits:
                return jsonify({"error": "No exhibits found"}), 404

            return jsonify(exhibits), 200

    except Exception as e:
        print(f"Error fetching exhibits: {e}")
        return jsonify({"error": "Internal server error"}), 500


def process_exhibit(exhibit):
    """Helper function to process a single exhibit."""
    # Convert ObjectId to string
    exhibit["_id"] = str(exhibit["_id"])

    # Process artworks
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
            "conservation_guidelines": artwork.get("conservation_guidelines", {}).get(
                "Conservation_Guidelines", "N/A"
            ),
            "taxonomy": artwork.get("taxonomy_tags", {}).get("artwork_taxonomy", {}),
            "visual_context": artwork.get("visual_context", []),
        }
        for artwork in exhibit.get("artworks", [])
    ]

    # Process excel_images at the exhibit level
    excel_images = exhibit.get("excel_images", [])
    if excel_images:
        processed_images = [
            f"data:image/jpeg;base64,{img}" if not img.startswith("data:image") else img
            for img in excel_images
        ]
        exhibit["excel_images"] = processed_images
    else:
        exhibit["excel_images"] = []  # Default to empty list if no images are present

    # Process floor plan
    floor_plan = exhibit.get("floor_plan")
    if floor_plan:
        # Check if the floor_plan already has the Base64 prefix
        if not floor_plan.startswith("data:image"):
            floor_plan = f"data:image/jpeg;base64,{floor_plan}"  # Default to JPEG
        exhibit["floor_plan"] = floor_plan
    else:
        exhibit["floor_plan"] = None

    # Process other fields
    exhibit["exhibit_title"] = exhibit.get("exhibit_title", "Untitled Exhibit")
    exhibit["concept"] = exhibit.get("concept", "")
    exhibit["subsections"] = exhibit.get("subsections", [])

    return exhibit




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




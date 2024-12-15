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
            conservation_guidelines = {
                "conservation_guidelines": openai_feedback.get("Conservation_Guidelines", [])
            }
            metadata_without_image["conservation_guidelines"] = conservation_guidelines
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
                taxonomy_tags = {
                    "artwork_taxonomy": taxonomy_feedback.get("taxonomy_tags", {})
                }
                metadata_without_image["taxonomy_tags"] = taxonomy_tags
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
                metadata_without_image["visual_context"] = visual_context
            except Exception as e:
                return jsonify({"error": f"Failed to process visual context: {str(e)}"}), 500

        # Transform form data to match the Excel structure
        def transform_artwork_data(data):
            """Transform artwork data to ensure consistent MongoDB structure."""
            return {
                "Artwork Title": data.get("title", ""),
                "Artwork Description": data.get("description", ""),
                "Artist Name": data.get("artist_name", ""),
                "Dating": data.get("date_of_creation", ""),
                "Material": data.get("material", ""),
                "Dimension": f"{data.get('width', '')}x{data.get('height', '')}x{data.get('breadth', '')}",
                "Display Type": data.get("display_type", ""),
                "Geographical Association": data.get("geographical_association", ""),
                "Acquisition Type": data.get("acquisition_type", ""),
                "Exhibition Utilisation": data.get("exhibition_utilisation", ""),
                "Style Significance": data.get("style_significance", ""),
                "Historical Significance": data.get("historical_significance", ""),
                "visual_context": data.get("visual_context", []),  # Ensure this is an array
                "conservation_guidelines": data.get("Conservation_Guidelines", {}),  # Ensure this is an object
                "taxonomy_tags": data.get("taxonomy_tags", {})  # Ensure this is an object
            }

        # Transform the new artwork data
        new_artwork = transform_artwork_data(metadata_without_image)

        # Update MongoDB: Add new artwork and image to separate fields
        try:
            create_exhibits.update_one(
                {"_id": ObjectId(exhibition_id)},
                {
                    "$push": {"artworks": new_artwork},  # Add to artworks array
                    "$addToSet": {"Excel_images": image_data}  # Add image to Excel_images field
                }
            )
        except Exception as e:
            return jsonify({"error": f"Failed to update exhibition with artwork and image: {str(e)}"}), 500

        # Return success response
        return jsonify({
            "message": "Artwork uploaded and processed successfully",
            "artwork_data": new_artwork,
            "image_stored": image_data is not None,
            "openai_feedback": openai_feedback,
            "taxonomy_feedback": taxonomy_feedback,
            "visual_context": visual_context
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/create_exhibit", methods=["POST"])
def create_exhibit():
    try:
        print("Incoming form data:", request.form.to_dict())
        print("Incoming files:", list(request.files.keys()))

        # Extract form data
        exhibit_title = request.form.get("exhibit_title")
        concept = request.form.get("concept")
        subsections = json.loads(request.form.get("subsections", "[]")) \
            if "subsections" in request.form else []

        floor_plan_file = request.files.get("floor_plan")
        if not floor_plan_file:
            return jsonify({"error": "Floor plan file is missing."}), 400

        # Validate exhibit title and concept
        if not exhibit_title or not concept:
            return jsonify({"error": "Missing required fields: 'exhibit_title' or 'concept'"}), 400

        # Validate floor_plan file type
        allowed_extensions = {"png", "jpg", "jpeg"}
        extension = floor_plan_file.filename.rsplit('.', 1)[-1].lower()
        if extension not in allowed_extensions:
            return jsonify({"error": "Floor plan must be PNG, JPG, or JPEG."}), 400

        # Read and convert floor_plan once
        floor_plan_binary = floor_plan_file.read()
        floor_plan_base64 = base64.b64encode(floor_plan_binary).decode('utf-8')
        mime_type = "image/jpeg" if extension in ["jpg", "jpeg"] else "image/png"
        floor_plan_data_url = f"data:{mime_type};base64,{floor_plan_base64}"

        # Check artwork list file
        if "artwork_list" not in request.files:
            return jsonify({"error": "Missing artwork Excel file."}), 400


        try:
            artwork_file = request.files["artwork_list"]
            print(f"Processing Excel file: {artwork_file.filename}")
            processed_data = process_excel_file(artwork_file)

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
        # Prepare form_data
        form_data = {
            "exhibit_title": exhibit_title,
            "concept": concept,
            "subsections": subsections,
            "floor_plan": floor_plan_data_url,
            "artworks": processed_data["data"],
            "excel_images": processed_data["images"]
        }

        # Validate and process images from processed_data["images"] if needed
        valid_images = []
        for idx, image in enumerate(processed_data["images"]):
            try:
                print(f"Validating image {idx}")

                # Validate Base64 string
                if not is_valid_base64(image):
                    raise ValueError(f"Image {idx} is not a valid Base64 string.")

                valid_images.append(image)
                print(f"Image {idx} validated and processed successfully.")
            if not is_valid_base64(image):
                print(f"Image {idx} is not a valid Base64 string.")
                # Handle invalid image case if necessary
            valid_images.append(image)

        # Run OpenAI functions on the extracted artworks
        exhibit_info = {
            "exhibit_title": exhibit_title,
            "concept": concept,
            "subsections": subsections,
            "floor_plan": floor_plan_data_url,
        }

        for idx, row in enumerate(form_data["artworks"]):
            try:
                if idx < len(valid_images):
                    image_for_row = valid_images[idx]
                else:
                    image_for_row = None

                if not image_for_row:
                    row["error"] = f"No valid image for row {idx}. Skipping OpenAI calls."
                    continue

                # Run OpenAI-based functions
                row["visual_context"] = generate_visual_context(row, image_for_row, exhibit_info, "gpt-4o")
                row["conservation_guidelines"] = generate_response_conservation(row)
                row["taxonomy_tags"] = generate_taxonomy_tags(row, image_for_row, exhibit_info, "gpt-4o")
            except Exception as e:
                print(f"Error generating OpenAI metadata for row {idx}: {str(e)}")
                row["error"] = f"OpenAI metadata generation failed: {str(e)}"

        # Insert into MongoDB
        result = create_exhibits.insert_one(form_data)
        form_data["_id"] = str(result.inserted_id)
        print(f"Data inserted into MongoDB with ID: {form_data['_id']}")

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
            # Fetch a single exhibit with full details
            exhibit = fetch_exhibit_by_id(id)
            if not exhibit:
                return jsonify({"error": "Exhibit not found"}), 404

            return jsonify(process_exhibit(exhibit)), 200
        else:
            # Fetch all exhibits titles with pagination
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))

            exhibits_cursor = create_exhibits.find({}, {"exhibit_title": 1}).skip((page - 1) * per_page).limit(per_page)
            exhibits = [{"_id": str(exhibit["_id"]), "exhibit_title": exhibit.get("exhibit_title", "Untitled Exhibit")} for exhibit in exhibits_cursor]

            if not exhibits:
                return jsonify({"error": "No exhibits found"}), 404

            return jsonify(exhibits), 200

    except Exception as e:
        app.logger.error(f"Error fetching exhibits: {e}")
        return jsonify({"error": "Internal server error"}), 500

def fetch_exhibit_by_id(id):
    """Fetch a single exhibit by its ID."""
    try:
        return create_exhibits.find_one({"_id": ObjectId(id)})
    except Exception:
        return None

def process_exhibit(exhibit):
    """Helper function to process a single exhibit."""
    # Convert ObjectId to string
    exhibit["_id"] = str(exhibit["_id"])

    # Process artworks
    exhibit["artworks"] = [process_artwork(artwork) for artwork in exhibit.get("artworks", [])]

    # Process excel_images at the exhibit level
    exhibit["excel_images"] = process_images(exhibit.get("excel_images", []))

    # Process floor plan
    exhibit["floor_plan"] = process_floor_plan(exhibit.get("floor_plan"))

    # Process other fields
    exhibit["exhibit_title"] = exhibit.get("exhibit_title", "Untitled Exhibit")
    exhibit["concept"] = exhibit.get("concept", "")
    exhibit["subsections"] = exhibit.get("subsections", [])

    return exhibit

def process_artwork(artwork):
    """Process a single artwork entry."""
    return {
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
        "taxonomy": artwork.get("taxonomy_tags", {}).get("artwork_taxonomy", {}),
        "visual_context": artwork.get("visual_context", []),
    }

def process_images(images):
    """Process exhibit images."""
    return [
        f"data:image/jpeg;base64,{img}" if not img.startswith("data:image") else img
        for img in images
    ] if images else []

def process_floor_plan(floor_plan):
    """Process the floor plan image."""
    if floor_plan:
        return f"data:image/jpeg;base64,{floor_plan}" if not floor_plan.startswith("data:image") else floor_plan
    return None


# def get_exhibits(id):
#     try:
#         if id:
#             # Fetch a single exhibit
#             exhibit = create_exhibits.find_one({"_id": ObjectId(id)})
#             if not exhibit:
#                 return jsonify({"error": "Exhibit not found"}), 404

#             # Process and return the single exhibit
#             exhibit = process_exhibit(exhibit)
#             return jsonify(exhibit), 200

#         else:
#             # Fetch all exhibits
#             exhibits_cursor = create_exhibits.find()
#             exhibits = [process_exhibit(exhibit) for exhibit in exhibits_cursor]

#             if not exhibits:
#                 return jsonify({"error": "No exhibits found"}), 404

#             return jsonify(exhibits), 200

#     except Exception as e:
#         print(f"Error fetching exhibits: {e}")
#         return jsonify({"error": "Internal server error"}), 500


# def process_exhibit(exhibit):
#     """Helper function to process a single exhibit."""
#     # Convert ObjectId to string
#     exhibit["_id"] = str(exhibit["_id"])

#     # Process artworks
#     exhibit["artworks"] = [
#         {
#             "title": artwork.get("Artwork Title", "Untitled Artwork"),
#             "description": artwork.get("Artwork Description ", "No Description"),
#             "artist": artwork.get("Artist Name", "Unknown Artist"),
#             "dating": artwork.get(" Dating", "Unknown Date"),
#             "dimension": artwork.get("Dimension", "Unknown Dimensions"),
#             "material": artwork.get("Material", "Unknown Material"),
#             "display_type": artwork.get("Display Type", "N/A"),
#             "geographical_association": artwork.get("Geographical Association ", "N/A"),
#             "acquisition_type": artwork.get("Acquisition Type ", "N/A"),
#             "historical_significance": artwork.get("Historical Significance", "N/A"),
#             "style_significance": artwork.get("Style Significance", "N/A"),
#             "exhibition_utilization": artwork.get("Exhibition Utilisation ", "N/A"),
#             "conservation_guidelines": artwork.get("conservation_guidelines", {}).get(
#                 "Conservation_Guidelines", "N/A"
#             ),
#             "taxonomy": artwork.get("taxonomy_tags", {}).get("artwork_taxonomy", {}),
#             "visual_context": artwork.get("visual_context", []),
#         }
#         for artwork in exhibit.get("artworks", [])
#     ]

#     # Process excel_images at the exhibit level
#     excel_images = exhibit.get("excel_images", [])
#     if excel_images:
#         processed_images = [
#             f"data:image/jpeg;base64,{img}" if not img.startswith("data:image") else img
#             for img in excel_images
#         ]
#         exhibit["excel_images"] = processed_images
#     else:
#         exhibit["excel_images"] = []  # Default to empty list if no images are present

#     # Process floor plan
#     floor_plan = exhibit.get("floor_plan")
#     if floor_plan:
#         # Check if the floor_plan already has the Base64 prefix
#         if not floor_plan.startswith("data:image"):
#             floor_plan = f"data:image/jpeg;base64,{floor_plan}"  # Default to JPEG
#         exhibit["floor_plan"] = floor_plan
#     else:
#         exhibit["floor_plan"] = None

#     # Process other fields
#     exhibit["exhibit_title"] = exhibit.get("exhibit_title", "Untitled Exhibit")
#     exhibit["concept"] = exhibit.get("concept", "")
#     exhibit["subsections"] = exhibit.get("subsections", [])

#     return exhibit




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


@app.route('/exhibits/<id>/floorplan', methods=['GET'])
def get_floorplan(id):
    try:
        exhibit = create_exhibits.find_one({"_id": ObjectId(id)})
        if not exhibit:
            return jsonify({"error": "Exhibit not found"}), 404

        floor_plan = exhibit.get("floor_plan")
        if not floor_plan:
            return jsonify({"error": "No floor_plan found for this exhibit"}), 404

        # Determine MIME type based on Base64 signature
        # Common checks:
        # PNG typically starts with "iVBORw0KGgo"
        # JPEG/JPG often start with "/9j"
        if floor_plan.startswith("iVBORw0KGgo"):
            mime_type = "image/png"
        elif floor_plan.startswith("/9j"):
            mime_type = "image/jpeg"
        else:
            # Default fallback if unrecognized; you can log or handle differently
            mime_type = "image/jpeg"  # or image/png as a fallback

        data_url = f"data:{mime_type};base64,{floor_plan}"

        return jsonify({"floor_plan": data_url}), 200

    except Exception as e:
        print(f"Error fetching floorplan: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/get_graph/<id>", methods=["GET"])
def get_graph_by_id(id):
    """
    Retrieves the graph data from MongoDB by exhibit_id and returns it as JSON.
    """
    graph_data = db['ArtworksGraph'].find_one({"exhibit_id": str(id)})
    if graph_data:
        graph_data["_id"] = str(graph_data["_id"])
        return jsonify(graph_data["graph"])
    else:
        return jsonify({"error": "Graph data not found for this exhibit"}), 404

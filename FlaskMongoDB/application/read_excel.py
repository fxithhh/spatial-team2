from openpyxl import load_workbook
from pymongo import MongoClient
from io import BytesIO
from PIL import Image as PILImage
import os

# MongoDB connection settings
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["spatial"]
collection = db["Bulkuploads"]

def process_excel_file(file_stream):
    """
    Processes the Excel file (in-memory), extracts metadata, data, and images,
    and stores them in MongoDB.
    """
    try:
        workbook = load_workbook(file_stream)

        # Extract metadata
        metadata = extract_metadata(workbook)

        # Extract rows and images
        data = extract_rows_and_images(workbook)
        if not data:
            raise ValueError("No data found in the uploaded file.")

        # Save to MongoDB
        save_to_mongo(metadata, data)

        return {"metadata": metadata, "data": data, "data_count": len(data)}

    except Exception as e:
        print(f"Error processing file: {e}")
        # Always return a consistent structure
        return {"error": str(e), "metadata": {}, "data": []}


def extract_metadata(workbook):
    """Extract metadata from the Excel workbook."""
    metadata = {
        "sheetnames": workbook.sheetnames,
        "active_sheet": workbook.active.title,
        "properties": {
            "title": workbook.properties.title,
            "author": workbook.properties.creator,
            "created": str(workbook.properties.created),
        }
    }
    return metadata

def extract_rows_and_images(workbook):
    """Extract row data and images from the Excel workbook."""
    data = []
    active_sheet = workbook.active

    # Extract rows
    for row in active_sheet.iter_rows(min_row=1, values_only=True):
        data.append({"row_data": list(row)})

    # Extract images
    if hasattr(active_sheet, "_images") and active_sheet._images:
        for idx, img_obj in enumerate(active_sheet._images):
            try:
                # Handle raw binary image data
                if isinstance(img_obj.ref, BytesIO):
                    img_data = img_obj.ref.getvalue()  # Extract raw bytes from BytesIO
                else:
                    img_data = img_obj.ref  # Use directly if it's already in bytes

                # Load the image using Pillow
                pil_img = PILImage.open(BytesIO(img_data))

                # Append image metadata to data
                data.append({
                    "image_binary": img_data
                })
            except Exception as e:
                print(f"Error processing image {idx}: {e}")

    return data

def save_to_mongo(metadata, data):
    """Save metadata and rows to MongoDB."""
    # Insert all rows into MongoDB without specifying `_id`
    if data:
        collection.insert_many(data)

    # Insert metadata as a separate document
    collection.insert_one(metadata)

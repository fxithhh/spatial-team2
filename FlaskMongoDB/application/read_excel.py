from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException
import base64

# Standard Library Imports
import base64

# Third-Party Imports
from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException
from io import BytesIO


def process_excel_file(file):
    """
    Processes the Excel file uploaded via form data to extract tabular data and embedded images.
    """
    try:
        # Load workbook from the uploaded file (file-like object)
        workbook = load_workbook(file, data_only=True)
    except InvalidFileException:
        raise ValueError("Invalid Excel file format")
    except Exception as e:
        raise ValueError(f"Error loading Excel file: {str(e)}")

    # Extract data and images from the workbook
    extracted_data = extract_rows_and_images(workbook)
    print("Debug: Extracted data from Excel file:", extracted_data)

    # Separate tabular data and images
    tabular_data = []
    headers = workbook.active.iter_cols(min_row=1, max_row=1, values_only=True)
    headers = [header[0] if header else "" for header in headers]

    for idx, row in enumerate(extracted_data):
        if "row_data" in row:
            row_data = dict(zip(headers, row["row_data"]))
            tabular_data.append(row_data)
        if "image_base64" in row:
            # Add embedded image data to the corresponding row, if applicable
            row_index = row.get("row_index")
            if row_index is not None and row_index < len(tabular_data):
                tabular_data[row_index]["embedded_image"] = row["image_base64"]

    # Extract standalone images
    images = [row["image_base64"] for row in extracted_data if "image_base64" in row]

    # Return as a dictionary
    result = {
        "data": tabular_data,  # List of dictionaries representing the rows
        "images": images       # List of standalone image Base64 strings
    }
    print("Debug: Processed data to be returned:", result)
    return result


def extract_rows_and_images(workbook):
    """
    Extracts rows and images from the workbook and associates images with row metadata.
    """
    data = []
    active_sheet = workbook.active

    # Extract rows from the active sheet
    for idx, row in enumerate(active_sheet.iter_rows(min_row=2, values_only=True)):
        data.append({"row_data": list(row), "row_index": idx})

    # Extract images with debugging
    if hasattr(active_sheet, "_images") and active_sheet._images:
        print(f"Found {len(active_sheet._images)} images in the sheet.")
        for img_obj in active_sheet._images:
            try:
                # Debugging: Type of img_obj.ref
                print(f"Image type: {type(img_obj.ref)}")
                
                img_data = img_obj.ref

                # Convert BytesIO to bytes if necessary
                if isinstance(img_data, BytesIO):
                    img_data.seek(0)
                    img_data = img_data.read()
                    print("Image read from BytesIO.")

                # Convert image to Base64
                image_base64 = base64.b64encode(img_data).decode("utf-8")
                print("Image converted to Base64.")

                # Append image metadata to row
                if img_obj.anchor:
                    cell_reference = img_obj.anchor._from
                    row_index = cell_reference.row - 1
                    data.append({"row_index": row_index, "image_base64": image_base64})
                    print(f"Image associated with row {row_index}.")
            except Exception as e:
                print(f"Error extracting image: {str(e)}")
    else:
        print("No images found in the sheet.")

    return data
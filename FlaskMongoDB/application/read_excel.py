
import base64
import openpyxl
from PIL import Image
from openpyxl import load_workbook
from openpyxl.utils.exceptions import InvalidFileException
import io
from openpyxl_image_loader import SheetImageLoader



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

   # Check if the sheet exists
    sheet_name = "Output"
    if sheet_name not in workbook.sheetnames:
        raise ValueError(f"Sheet '{sheet_name}' not found in the workbook")
    else:
        output_sheet = workbook["Output"]
    

    # Extract data and images from the workbook
    extracted_data,base64_image_ls = extract_rows_and_images(output_sheet)

    # Return as a dictionary
    result = {
        "data": extracted_data,  # List of dictionaries representing the rows
        "images": base64_image_ls       # List of standalone image Base64 strings
    }
   
    return result


def extract_rows_and_images(sheet):
    """
    Extracts rows and images from the workbook and associates images with row metadata.
    """
    data = []
    active_sheet = sheet
    
    # Extract rows from the active sheet
    for idx, row in enumerate(active_sheet.iter_rows(min_row=2, values_only=True)):
        data.append({"row_data": list(row), "row_index": idx})
    
    base64_image_ls = []

    # # Check all cells for images
    for row_idx, row in enumerate(sheet.iter_rows(min_row=2, max_col=sheet.max_column, max_row=sheet.max_row)):
        for cell in row:
            cell_coord = cell.coordinate
            try:
                # Attempt to retrieve the image
                image_loader = SheetImageLoader(sheet)
                image = image_loader.get(cell_coord)
                # Convert the image to bytes
                img_buffer = io.BytesIO()  # Create an in-memory buffer
                image.save(img_buffer, format='PNG')  # Save the image in PNG format to the buffer
                img_buffer.seek(0)  # Move the pointer to the start of the buffer
                image_base64 = base64.b64encode(img_buffer.getvalue()).decode("utf-8")  # Encode in base64
                base64_image_ls.append(image_base64)
                # Locate the row in `data` and overwrite the corresponding cell with base64
                for entry in data:
                    if entry['row_index'] == row_idx:  # Match the row index
                        column_idx = cell.column - 1  # Convert column letter to zero-based index
                        entry['row_data'].pop(column_idx)
                        break

            except ValueError:
                # If no image is found, skip
                pass
      # After processing all cells for a row, check for invalid values
        for entry in data:
            if entry['row_index'] == row_idx:
                count_invalid_values = sum(1 for value in entry['row_data'] if value in [0, None])

                # Remove the row from `data` if there are more than 4 invalid values
                if count_invalid_values > 4:
                    data.remove(entry)
        # Re-adjust the row indices after removal
    for idx, entry in enumerate(data):
        entry['row_index'] = idx  # Update the row_index to reflect the new position



    return data,base64_image_ls

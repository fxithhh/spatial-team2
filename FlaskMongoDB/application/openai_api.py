import os
import json
import base64
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image
from pymongo import MongoClient
from langchain_core.vectorstores import InMemoryVectorStore
from langchain.schema import Document

from .vectorstore import embeddings

# Load environment variables
load_dotenv()

# Retrieve environment variables
MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")

print(f"API_KEY: {'Set' if API_KEY else 'Not Set'}: {API_KEY[:4]}****{API_KEY[-4:]}" if API_KEY else "API_KEY is Not Set")

# Initialize OpenAI client
client = OpenAI(api_key=API_KEY)

# Database configuration
DB_NAME = "spatial"
COLLECTION_NAME = "Vectorstore"

# Function to load vectorstore from MongoDB
def load_vectorstore_from_mongo(collection_name=COLLECTION_NAME):
    # Connect to MongoDB
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    collection = db[collection_name]

    # Fetch all vectorstore data
    vectorstore_data = collection.find()

    # Reconstruct Document objects
    documents = []
    for doc in vectorstore_data:
        document = Document(
            page_content=doc["content"],
            metadata=doc["metadata"]
        )
        documents.append(document)

    # Recreate the vectorstore
    vectorstore = InMemoryVectorStore.from_documents(
        documents=documents,
        embedding=embeddings
    )

    print(f"Vectorstore loaded from MongoDB collection '{collection_name}'.")
    return vectorstore

# Predefined Exhibition Sections
ex_sections = [
    "Durational Performance and the Passage of Time",
    "Art as Lived Experience",
    "Resilience in Adversity",
    "Acts of Resistance and Agency",
    "Sense-Making in Crisis",
    "Cultural Practices and the Everyday",
    "Collective Strength in Individual Actions",
    "Asian Perspectives on the Everyday"
]

# Define the base directory using pathlib
BASE_DIR = Path(__file__).resolve().parent

# Construct the relative path to the taxonomy JSON file
taxonomy_path = BASE_DIR / 'taxonomy_picklist.json'

# Load taxonomy template and update exhibition sections
try:
    with taxonomy_path.open("r", encoding="utf-8") as file:
        tax_template = json.load(file)
        print(tax_template)
    tax_template["artwork_taxonomy"]["Exhibition_Section"] = ex_sections
    print("Taxonomy template loaded and updated successfully.")
except FileNotFoundError:
    print(f"Taxonomy file not found at {taxonomy_path}. Please check the relative path.")
except json.JSONDecodeError as e:
    print(f"Error decoding JSON from the taxonomy file: {e}")

# Function to generate conservation response
def generate_response_conservation(metadata, vectorstore=None, model="gpt-4o"):
    if vectorstore is None:
        vectorstore = load_vectorstore_from_mongo()
    metadata_str = json.dumps(metadata)
    query = f"""Given the metadata of the artwork \n
    - Use the material information of the artwork and retrieve relevant information towards conservation guidelines of the artwork
    - Use the dimensions and material of the artwork and retrieve relevant information that should be considered for fire safety guidelines
    \nMetadata: {metadata_str}
    """

    query_embedding = embeddings.embed_query(query)
    relevant_docs = vectorstore.similarity_search_by_vector(query_embedding, k=3)
    retrieved_context = ""

    # Retrieve context from relevant documents
    for i, doc in enumerate(relevant_docs):
        retrieved_context += f"{i+1}. {doc.page_content}\n"

    # Call OpenAI API for conservation guidelines
    guideline_response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": """ 
                You are an artwork conservation specialist and fire safety expert.\n
                Your role is to analyze provided artwork metadata, leveraging your expertise in conservation and fire safety. 
                """
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""Given the fire safety and conservation guidelines in the image: {retrieved_context} \n 
                        together with material information and dimensions from the artwork metadata {metadata}\n
                        ***Format***
                        Your response should be formatted in JSON with the key "Conservation_Guidelines," containing a python list of 3 to 5 actionable recommendations that are coherent, specific, and tailored to the context provided.\n

                              "Conservation_Guidelines": [
                                "Ensure the artwork is stored in a climate-controlled environment with humidity levels between 45-55% to prevent degradation.",
                                "Install non-reactive fire suppression systems like water mist or inert gas to minimize potential damage to the artwork.",
                                "Conduct regular inspections for signs of wear, including discoloration or cracking, and implement immediate conservation measures if identified.",
                                "Keep the artwork away from direct sunlight and UV light exposure to prevent fading of pigments."
                              ]
                             \n"""
                    },
                ],
            }
        ],
        response_format={"type": "json_object"},
        max_tokens=500
    )

    # Extract response content
    answer_temp = guideline_response.choices[0].message.content
    answer = json.loads(answer_temp)
    return answer

# Function to convert image to JPEG
def convert_image_to_jpeg(image_binary, output_format="JPEG"):
    try:
        image = Image.open(BytesIO(image_binary))

        # Ensure conversion to RGB for JPEG compatibility
        if image.mode != "RGB" and output_format.upper() == "JPEG":
            image = image.convert("RGB")

        # Save to JPEG format in a buffer
        buffer = BytesIO()
        image.save(buffer, format=output_format, quality=100)
        buffer.seek(0)

        return buffer.read()
    except Exception as e:
        print(f"Error converting image to JPEG: {e}")
        return None

# Taxonomy Tagging Function
def generate_taxonomy_tags(metadata, image_data, tax_template, model="gpt-4o"):

    # Call OpenAI API for taxonomy tagging
    taxonomy_response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "A system that generates taggings for museums based on the provided artwork image and its metadata. The system references an established artwork taxonomy to assign appropriate tags according to the provided categories and choices. Ensure that the answer should strictly adhere to the taxonomy JSON format provided."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Given the metadata in the image: {metadata} and the image information, assign its tagging according to this taxonomy format {tax_template}"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}"
                        },
                    },
                ]
            }
        ],
        response_format={"type": "json_object"},
        max_tokens=300
    )

    # Extract response content
    tags_temp = taxonomy_response.choices[0].message.content
    tags = json.loads(tags_temp)
    return tags

def generate_visual_context(metadata, image_data, tax_template, model="gpt-4o"):
     response_1 = client.chat.completions.create(
        model=model,
      messages=[
          {
      "role": "system",
     "content": """ You are a visual analysis assistant intended help with visual aid. 
     Your task is to evaluate  images and provide an objective and concise description of their visible content. 
     Focus exclusively on describing tangible elements such as color, content, and prominent objects or figures in a specific manner without irrelevant discourse. 
     Do not mention lighting conditions, inferred visual effects and dynamics created by the object, atmospheric style of descriptions or any language that speculates or interprets the image's context. 
     Do not include details about the background unless it contains distinct, visible elements relevant to the artwork itself and can be visibly recognized to be beyond an art gallery. 
     Exclude speculative commentary and any background descriptions if its in a gallery settings. 
     Provide the description in up to 5 bullet pointers, be concise and succinct to the point with each describing the visual features in a neutral and precise tone. Pointers need not be in complete sentences but ensure formatting is consistent.
     """    },
        {
          "role": "user",
          "content": [

            {
              "type": "image_url",
              "image_url": {
                "url":  f"data:image/jpeg;base64,{image_data}"
              },
            },
          ],
        }
      ],response_format={"type":"text"},
      max_tokens=300,
    )
     initial_des = response_1.choices[0].message.content
     response_2 = client.chat.completions.create(
      model="gpt-4o",
      messages=[
          {
      "role": "system",
     "content": """ You are an objective image analysis assistant. Your task is to generate accurate and concise descriptions based solely on the visual elements present in the image. Follow these principles:

                    1. Focus strictly on the observable features of the image, avoiding any speculative or inferential commentary.
                    2. Ensure that the description is precise, factual, and directly relevant to the visual output, with no unnecessary elaboration or assumptions.
                    3. Prioritize clarity and relevance to ensure that the description aligns with the purpose of the analysis.
                    4. Format the bullet point response into a json object, with the title being "visual_context"and the bullet points in a list template
                    
                    **To Evaluate**
                    {initial_des}
     """    },
        {
          "role": "user",
          "content": [

            {
              "type": "image_url",
              "image_url": {
                "url":  f"data:image/jpeg;base64,{image_data}"
              },
            },
          ],
        }
      ],response_format={"type":"json_object"},
      max_tokens=300,
    )
     
     viz_temp = response_2.choices[0].message.content
     viz_info = json.loads(viz_temp)
     return viz_info["visual_context"]
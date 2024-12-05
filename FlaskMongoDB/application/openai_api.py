from dotenv import load_dotenv
import os
from openai import OpenAI
import json,base64
from io import BytesIO
from PIL import Image
from pymongo import MongoClient
from langchain_core.vectorstores import InMemoryVectorStore
from langchain.schema import Document
from .vectorstore import embeddings
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")
print(f"API_KEY: {'Set' if API_KEY else 'Not Set'}: {API_KEY[:4]}****{API_KEY[-4:]}" if API_KEY else "API_KEY is Not Set")
SECRET_KEY = os.getenv("SECRET_KEY")

client = OpenAI(api_key=API_KEY)
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

# Load taxonomy template and update exhibition sections
with open(r"C:\Users\Brighton\Desktop\SUTD files\Term 7\spatial\Code\taxanomy\taxonomy_picklist.json", "r") as file:
    tax_template = json.load(file)
tax_template["artwork_taxonomy"]["Exhibition_Section"] = ex_sections


# Function to generate conservation response
def generate_response_conservation(metadata, vectorstore, model="gpt-4o-mini"):
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
        {"type": "text", "text": f"Given the fire safety and conservation guidelines in the image: {retrieved_context} \n "
        f"together with material information and dimensions from the artwork metadata {metadata}\n"
        f"""Generate concise guidelines to ensure the safe preservation and protection of the artwork. If information is insufficent, use the current understanding of the artwork and general knowledge of artwork conservation and come up with plausible conservation guidelines\n
        ***Format***\n
        Your response should be formatted in JSON with the key "Conservation_Guidelines," containing a python list of 3 to 5 actionable recommendations that are coherent, specific, and tailored to the context provided.\n

              "Conservation_Guidelines": [
                "Ensure the artwork is stored in a climate-controlled environment with humidity levels between 45-55% to prevent degradation.",
                "Install non-reactive fire suppression systems like water mist or inert gas to minimize potential damage to the artwork.",
                "Conduct regular inspections for signs of wear, including discoloration or cracking, and implement immediate conservation measures if identified.",
                "Keep the artwork away from direct sunlight and UV light exposure to prevent fading of pigments."
              ]
             \n
        """},
       
          ],
        }
      ],
        response_format={"type": "json_object"},
        max_tokens=500
    )

    # Extract response content
    answer = guideline_response.choices[0].message.content
    return answer

from PIL import Image
from io import BytesIO

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
def generate_taxonomy_tags(metadata, image_data, tax_template, model="gpt-4o-mini"):

    # Call OpenAI API for taxonomy tagging
    taxonomy_response = client.chat.completions.create(
        model=model,
        messages=[
      {
        "role": "system",
        "content": "A system that generates taggings for museums based on the provided artwork image and its metadata. The system references an established artwork taxonomy to assign appropriate tags according to the provided categories and choices. Ensure that the answer should strictly adhere to the taxonomy JSON format provided."
          },
          {"role": "user","content": [{"type": "text", "text": f"Given the metadata in the image: {metadata} and the image information, assign its tagging according to this taxonomy format {tax_template}"},{"type": "image_url", "image_url": {"url":  f"data:image/jpeg;base64,{image_data}"},},],}],
        response_format={"type": "json_object"},
        max_tokens=300
    )

    # Extract response content
    tags = taxonomy_response.choices[0].message.content
    return tags


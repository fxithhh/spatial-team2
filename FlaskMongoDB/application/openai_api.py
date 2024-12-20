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
    doc_count = 0
    # Retrieve context from relevant documents
    for i, doc in enumerate(relevant_docs):
        doc_count +=1
        retrieved_context += f" <<< DOCUMENT {doc_count} >>> \n {doc.metadata} - {doc.page_content}\n <<<END OF DOCUMENT {doc_count}>>>\n\n "
    # Process Retrieved Context from Embedding Query
    format_context = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
      {
          "role": "system",
          "content": """ 
            You are a document processing assistant. 
            Your task is to extract and reformat information from retrieved documents to create a structured, concise, and readable format for use as context in a large language model (LLM). 
            Ensure the restructured output is well-organized and highlights key details for comprehension.
            
            **Instructions:**
            - Input Format: There are multiple documents, with each of the retrieved documents will start with a format like this as a header: {'source': 'file name.pdf', 'page': integer}. 
            - Preserve Critical Details: Extract relevant details like headings, subheadings, tables, and core information without altering the meaning.
            - Use Markdown Formatting: Format text in a clear structure with appropriate headers, lists, and tables where applicable.
            - Include Metadata: At the start of each document, include the source file path and page number in this format:
            Source: <file_path>
            Structure Information: Organize content with:
            Headers (#, ##, etc.) for sections or chapters.
            Bullets/Numbered Lists for enumerations.
            Tables for structured data.
            Ensure Readability: Avoid overly long sentences. Keep the content concise and focus on key points.
            
            **Output Format**
            *Document* : Document Number
            *Source*: File Name
            *Content* : Formatted Information
            REPEAT THIS FOR ALL DOCUMENTS PROVIDED 
            """
      },
       {
          "role": "user",
          "content": [
        {"type": "text", "text": f""" Document Retrieved: {retrieved_context} Total Documents: {doc_count}
        
        """},
       
          ],
        }
      ],response_format={"type":"text"},
      max_tokens=1000,
    )
    context = format_context.choices[0].message.content



    # Call OpenAI API for conservation guidelines
    guideline_response = client.chat.completions.create(
        model=model,
        messages=[
      {
          "role": "system",
          "content": """ 
          You are an artwork conservation specialist and fire safety expert based in Singapore.\n
          Your role is to analyze provided artwork metadata, leveraging the context provided and your existing understanding in conservation and fire safety. 
          
          **Instructions**
          - Generate concise guidelines to ensure the safe preservation and protection of the artwork using the provided context that is relevant to the artwork. 
          - If information is insufficent, use the general knowledge you possess along with the metadata of the artwork and general knowledge of artwork conservation and come up with plausible conservation guidelines
          - Account for the nature of the installation, dimensions of the artwork in the generated fire safety guidelines
          - Do not mention the classification alphabets in the guidelines. If required for referencing, cite the relevant materials to the classification 
          - For guidelines pertaining to fire safety, cite the specific code or regulation if available from the provided guidelines. Ensure that advice provided accounts for the laws and codes for Singapore. 
          - Synthesise the reccomendations in a readable, succint manner such that it can be easily understood by a museum curator.\n
          
          **Output Format**
          - Your response should be formatted in JSON with the key "Conservation_Guidelines," containing a python list of 3 to 5 actionable recommendations 
          - Reccomendations must be concise, coherent, specific, and tailored to the context provided.\n
          - Each reccomendation should begin with a title mentioning its nature before following up with the description. For example : "Title of reccomendation: Description"
          - Utilise Markdown syntax for each guideline to enhance its readablity, with bold words for the title of the recommendations and italics for building codes. 
          """
      },
       {
          "role": "user",
          "content": [
        {"type": "text", "text": f"Fire safety and conservation guidelines in the image: {context} \n "
        f"Artwork metadata {metadata}\n"
        },
       
          ],
        }
      ],response_format={"type":"json_object"},
      max_tokens=500
    )

    # Extract response content
    answer_temp = guideline_response.choices[0].message.content
    answer = json.loads(answer_temp)
    print(answer)
    return answer

# Taxonomy Tagging Function
def generate_taxonomy_tags(metadata, image_data,exhibit_info, model="gpt-4o"):
    # Call OpenAI API for taxonomy tagging
    #Set Up Taxonomy Template
    # Define the base directory using pathlib
    BASE_DIR = Path(__file__).resolve().parent

    # Construct the relative path to the taxonomy JSON file
    taxonomy_path = BASE_DIR / 'taxonomy_picklist.json'

    # Load taxonomy template and update exhibition sections
    try:
        with taxonomy_path.open("r", encoding="utf-8") as file:
            taxonomy_template = json.load(file)
        print(taxonomy_template)

    except FileNotFoundError:
      print(f"Taxonomy file not found at {taxonomy_path}. Please check the relative path.")
    except json.JSONDecodeError as e:
      print(f"Error decoding JSON from the taxonomy file: {e}")

    # Append defined subsections
    ex_sections = exhibit_info["subsections"]
    taxonomy_template["artwork_taxonomy"]["Exhibition Section"] = ex_sections

    #Picking From Taxonomy Template

    taxonomy_response = client.chat.completions.create(
        model=model,
         messages=[
      {
        "role": "system",
        "content": f"""
                A system that generates taggings for museums based on the provided artwork image and its metadata. 
                The system references an established artwork taxonomy to assign appropriate tags according to the provided categories and choices. 
                Ensure that the output should strictly adhere to the taxonomy JSON format provided, and should not repeate fills existing in the metadata
                
                Utilise the artwork metadata, artwork image and exhibition information to aid in the tagging process.

                 **Output Guidelines**:
                 - Output format MUST be in a json format with the title "artwork_taxonomy", with the categories STRICTLY FOLLOWING the JSON Taxonomy Template.
                 {taxonomy_template}
                 - Do not include fills from the metadata that are not relevant with the provided format 
                
                
                """
    },
              {
      "role": "user",
      "content": [
        {"type": "text", "text": 
         f"""
        Artwork Metadata: {metadata}  \n
        Exhibition Information: {exhibit_info} \n

        
        
        
        """},
        {
          "type": "image_url",
          "image_url": {
            "url":  f"data:image/jpeg;base64,{image_data}"
          },
        },
      ],
    }
        ],
        response_format={"type": "json_object"},
        max_tokens=300
    )

    #Generating Recommendations
    tags_temp = taxonomy_response.choices[0].message.content
    tax_tags = json.loads(tags_temp)
    print(tags_temp)
    response_reccs = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
              {
          "role": "system",
          "content": f"""
        
        You are an expert museum curation assistant specializing in generating actionable insights and recommendations for artwork display, storytelling, and audience engagement. 
        Using the provided metadata about an artwork, provide insightful recommendations for curators.
        
        **Input Metadata Template**:
        - Title:
        - Description: 
        - Artist Name: 
        - Date of Artwork: 
        - Medium: 
        - Dimensions: 
        - Display Type: 
        - Geographical Association: 
        - Acquisition Type:
        - Historical Significance: 
        - Style Significance: 
        - Exhibition Utilization:

        **Recommendations Categories**

        1. **Lighting Requirements**: Suggest the type of lighting setup needed for optimal display, considering the artwork's medium, dimensions,exhibition utilization and material properties. 

        2. **Display Suggestions**: Recommend ideal placements and configurations for the artwork. Include insights on orientation (e.g., vertical or horizontal), display type (e.g., wall-mounted, free-standing), and any spatial requirements.

        3. **Storytelling Potential**: Highlight the key narrative or thematic elements of the artwork. Suggest how it can be integrated into broader exhibition themes or its potential as a centerpiece for storytelling.

        4. **Emotional Connection Tags**: Analyze the artwork's description and image information to provide precise tags that reflect its emotional resonance. Ensure that it is relevant to the exhibition concept, artwork description and its historical context.

        5. **Historical Context**: Provide insights on the artwork's historical and cultural significance based on its creation date of artwork, artist, historical significance and any notable movements or events it reflects.



        **Output Guidelines**:
        - Output format MUST be in a json object format, with title "Recommendations" and its items in accordance to the categories featured in Recommendations Categories. Use space to separate words instead of underscores
        - Generate the top 5 recommendations for each category and place it in a list format mapped to its respective category
        - Each of the recommendations must not exceed 8 words, and should not be using any abbrievations. 
        - Each recommendations for each category must be unique and distinct from each other 
        - If the metadata lacks sufficient detail, infer plausible recommendations based on context and similar known artworks.

          
          """},

            {
              "role": "user",
              "content": [
                {"type": "text", "text": f"""
                Artwork Metadata: {metadata}  \n
                Exhibition Information: {exhibit_info}        
                """},
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
    
    print(response_reccs.choices[0].message.content)

    recc_tags = json.loads(response_reccs.choices[0].message.content)
    if recc_tags["Recommendations"]:
      for category, items in recc_tags["Recommendations"].items():
          # Format the category name for artwork_taxonomy (e.g., replace spaces with underscores)
          formatted_category = category.replace(" ", "_")
          
          # Check if the field exists in artwork_taxonomy
          if formatted_category in tax_tags["artwork_taxonomy"]:
              # Append to the existing list
              tax_tags["artwork_taxonomy"][formatted_category].extend(items)
          else:
              # Create a new field with the items
              tax_tags["artwork_taxonomy"][formatted_category] = items
    else: 
        print(" Error Generating Recommendations")

    print(tax_tags)

    return tax_tags

def generate_visual_context(metadata, image_data, tax_template, model="gpt-4o"):
     response_1 = client.chat.completions.create(
        model=model,
      messages=[
          {
      "role": "system",
     "content": """ You are a visual analysis assistant intended help with visual aid. 
     Your task is to evaluate  images and provide an objective and concise description of their visible content. 
     **Instructions**
     - Focus exclusively on describing tangible elements such as color, content, and prominent objects or figures in a specific manner without irrelevant discourse. 
     - Do not mention lighting conditions, inferred visual effects and dynamics created by the object, atmospheric style of descriptions or any language that speculates or interprets the image's context. 
     - Do not include details about the background unless it contains distinct, visible elements relevant to the artwork itself and can be visibly recognized to be beyond an art gallery. 
     - Exclude speculative commentary and any background descriptions if its in a gallery settings. 
     - Provide the description in up to 5 bullet pointers, be concise and succinct to the point with each describing the visual features in a neutral and precise tone. Pointers need not be in complete sentences but ensure formatting is consistent.
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
                    
            
     """    },
        {
          "role": "user",
          "content": [
            {"type": "text", "text": f"To Evaluate: {initial_des} "},

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
     print(viz_info["visual_context"])
     return viz_info["visual_context"]
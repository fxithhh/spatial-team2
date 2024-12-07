import json
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings
from langchain.document_loaders import PyPDFLoader
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")
DB_NAME = "spatial"
COLLECTION_NAME = "Vectorstore"

# PDF file paths for creating the vectorstore (used only for saving)
PDF_PATHS = [
    r"C:\Users\Brighton\Desktop\SUTD files\Term 7\spatial\Code\compliance_resources\'Ideal Condition Ranges by Material Type' CCAHA (ND).pdf",
    r"C:\Users\Brighton\Desktop\SUTD files\Term 7\spatial\Code\compliance_resources\2015 Light Duration Guidlines-Smithsonian.pdf",
    r"C:\Users\Brighton\Desktop\SUTD files\Term 7\spatial\Code\compliance_resources\Code of Practice for Fire Precautions in Buildings.pdf"
]

# Initialize OpenAI Embeddings globally
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    api_key=API_KEY)

# Function to save vectorstore to MongoDB
def save_vectorstore_to_mongo(pdf_paths, collection_name=COLLECTION_NAME):
    # Load documents from PDF files
    documents = []
    for pdf_path in pdf_paths:
        loader = PyPDFLoader(pdf_path)
        documents.extend(loader.load())

    # Create vectorstore from documents
    vectorstore = InMemoryVectorStore.from_documents(
        documents,
        embedding=embeddings
    )

    # Extract data for MongoDB storage
    vectorstore_data = [
        {
            "content": doc.page_content,
            "metadata": doc.metadata,
            "embedding": embeddings.embed_query(doc.page_content)  # Generate embeddings
        }
        for doc in vectorstore.documents
    ]

    # Connect to MongoDB
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    collection = db[collection_name]

    # Save the vectorstore
    collection.insert_many(vectorstore_data)

    print(f"Vectorstore saved to MongoDB in collection '{collection_name}'.")
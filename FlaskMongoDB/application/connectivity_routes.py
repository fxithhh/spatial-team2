# connectivity_routes.py
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
import hashlib
import networkx as nx
from networkx.readwrite import json_graph
from datetime import datetime
from itertools import combinations
from tqdm import tqdm
from openai import OpenAI
from threading import Lock

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
API_KEY = os.getenv("API_KEY")

api = Blueprint('api', __name__)  # Use the blueprint for routes

mongo_client = MongoClient(MONGO_URI)
db = mongo_client.spatial

artworks_collection = db.Artworks
taxonomy_artworks_collection = db.TaxonomyArtworks
create_exhibits = db.Exhibits
graph_collection = db['ArtworksGraph']

# Initialize OpenAI client
client = OpenAI(api_key=API_KEY)

rubrics = """Visual Connectivity Rubric (The criteria for the AI to score the visual connectiveness between two artworks):
Color, Composition, Texture, Line, Shape, and Form
Recurring visual motifs or symbolic representations
Symbolic and Aesthetic Themes

Score Visual Connectivity out of 10

Narrative Connectivity Rubric (The criteria for the AI to score the narrative connectiveness between two artworks):
Historical or Cultural Context
Subject Matter (themes, stories, or subjects)
Emotional and Intellectual Resonance
Intended Audience and Purpose

Score Narrative Connectivity out of 10
"""

computation_in_progress = {}
computation_lock = Lock()

def compute_connectivity_scores(artwork_a, artwork_b):
    messages = [
        {
            "role": "system",
            "content": "You are an art expert who evaluates the connectivity between two artworks based on their visual and narrative aspects. You are provided a rubric, but feel free to evaluate freely as well."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": rubrics},
                {"type": "text", "text": f"Compare this artwork: {artwork_a['name']} by {artwork_a['artist']}"},
                {"type": "text", "text": "Description:"},
                {"type": "text", "text": artwork_a["description"]},
                {"type": "image_url", "image_url": {"url": artwork_a["imageurl"]}},
                {"type": "text", "text": f"With this artwork: {artwork_b['name']} by {artwork_b['artist']}"},
                {"type": "text", "text": "Description:"},
                {"type": "text", "text": artwork_b["description"]},
                {"type": "image_url", "image_url": {"url": artwork_b["imageurl"]}},
            ]
        }
    ]

    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": "connectivity_score_schema",
            "schema": {
                "type": "object",
                "properties": {
                    "visual_reasoning": {"type": "string"},
                    "visual_connectivity_score": {"type": "number"},
                    "narrative_reasoning": {"type": "string"},
                    "narrative_connectivity_score": {"type": "number"}
                },
                "required": [
                    "visual_reasoning",
                    "visual_connectivity_score",
                    "narrative_reasoning",
                    "narrative_connectivity_score",
                ],
                "additionalProperties": False
            }
        }
    }

    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format=response_format
        )
        response_content = completion.choices[0].message.content
        connectivity_data = json.loads(response_content)
        return connectivity_data
    except Exception as e:
        print(f"Error computing connectivity scores: {e}")
        return None

def prepare_artworks_for_evaluation(exhibit):
    """
    Convert exhibit artworks and excel_images into the required format.
    We assume that artworks and excel_images arrays match by index.
    """
    artworks = exhibit.get("artworks", [])
    images = exhibit.get("excel_images", [])

    prepared_artworks = []
    for i, artwork in enumerate(artworks):
        description = (
            f"description: {artwork.get('Artwork Description', '')} "
            f"historical significance: {artwork.get('Historical Significance', '')} "
            f"style significance: {artwork.get('Style Significance', '')} "
            f"exhibition utilisation: {artwork.get('Exhibition Utilisation', '')}"
        )

        imageurl = ""
        if i < len(images):
            # Convert base64 image to data URL
            imageurl = f"data:image/jpeg;base64,{images[i]}"

        prepared_artworks.append({
            "name": artwork.get("Artwork Title", "Untitled"),
            "artist": artwork.get("Artist Name", "Unknown Artist"),
            "description": description,
            "imageurl": imageurl
        })

    return prepared_artworks

@api.route('/test', methods=['GET'])
def test():
    return 'it works!'

@api.route('/exhibits/<id>/compute_pairwise', methods=['POST'])
def compute_pairwise_for_exhibit(id):
    with computation_lock:
        if computation_in_progress.get(id, False):
            # Already computing - return in progress status instead of error
            return jsonify({"status": "in progress"}), 200
        else:
            computation_in_progress[id] = True

    try:
        # Check if we already have a graph
        existing_graph = graph_collection.find_one({"exhibit_id": str(id)})
        if existing_graph:
            with computation_lock:
                computation_in_progress[id] = False
            existing_graph["_id"] = str(existing_graph["_id"])
            return jsonify({
                "message": "Graph already exists",
                "status": "complete",
                "exhibit_id": str(id),
                "graph": existing_graph["graph"]
            }), 200

        exhibit = create_exhibits.find_one({"_id": ObjectId(id)})
        if not exhibit:
            with computation_lock:
                computation_in_progress[id] = False
            return jsonify({"error": "Exhibit not found"}), 404

        artworks = prepare_artworks_for_evaluation(exhibit)
        if len(artworks) < 2:
            with computation_lock:
                computation_in_progress[id] = False
            return jsonify({"error": "Not enough artworks to compute pairwise evaluations."}), 400

        G = nx.Graph()

        # Add nodes with unique IDs (indexes)
        for i, artwork in enumerate(artworks):
            node_id = str(i)  # Unique node id based on index
            G.add_node(
                node_id,
                name=artwork['name'],
                artist=artwork['artist'],
                description=artwork['description'],
                imageurl=artwork['imageurl']
            )

        # Compute pairs using indices
        artwork_pairs = list(combinations(range(len(artworks)), 2))
        edge_count = 0
        for (a_idx, b_idx) in tqdm(artwork_pairs, desc="Evaluating artwork pairs"):
            artwork_a = artworks[a_idx]
            artwork_b = artworks[b_idx]
            connectivity_data = compute_connectivity_scores(artwork_a, artwork_b)
            if connectivity_data:
                G.add_edge(
                    str(a_idx),
                    str(b_idx),
                    visual_connectivity_score=connectivity_data['visual_connectivity_score'],
                    visual_reasoning=connectivity_data['visual_reasoning'],
                    narrative_connectivity_score=connectivity_data['narrative_connectivity_score'],
                    narrative_reasoning=connectivity_data['narrative_reasoning']
                )
                edge_count += 1
            else:
                print(f"No connectivity data for pair: {a_idx} - {b_idx}")

        data = json_graph.node_link_data(G)

        graph_document = {
            "graph": data,
            "created_at": datetime.utcnow(),
            "exhibit_id": str(id)
        }
        result = graph_collection.insert_one(graph_document)

        print(f"Total edges created: {edge_count}")

        return jsonify({
            "message": "Pairwise connectivity computed successfully",
            "status": "complete",
            "exhibit_id": str(id),
            "node_count": len(data.get("nodes", [])),
            "link_count": len(data.get("links", [])),
            "graph": data
        }), 200

    except Exception as e:
        print(f"Error computing pairwise for exhibit {id}: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        with computation_lock:
            computation_in_progress[id] = False

@api.route('/exhibits/<id>/status', methods=['GET'])
def get_computation_status(id):
    with computation_lock:
        status = computation_in_progress.get(id, False)
    if status:
        return jsonify({"status": "in progress"}), 200
    else:
        # Check if a graph exists
        existing_graph = graph_collection.find_one({"exhibit_id": str(id)})
        if existing_graph:
            return jsonify({"status": "complete"}), 200
        else:
            return jsonify({"status": "not started"}), 200

@api.route('/exhibits/<id>/pair_count', methods=['GET'])
def get_pair_count(id):
    exhibit = create_exhibits.find_one({"_id": ObjectId(id)})
    if not exhibit:
        return jsonify({"error": "Exhibit not found"}), 404

    artworks = prepare_artworks_for_evaluation(exhibit)
    n = len(artworks)
    pair_count = (n * (n - 1)) // 2
    return jsonify({"pair_count": pair_count}), 200

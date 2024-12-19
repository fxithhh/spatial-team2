# connectivity_routes.py
from io import BytesIO
from application import app, mongo, db
from flask import request, jsonify, Blueprint, render_template, redirect
from dotenv import load_dotenv
import os
import json
import base64
from bson import ObjectId
from pymongo import MongoClient
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

rubrics = """Visual Connectivity Rubric:
Color, Composition, Texture, Line, Shape, and Form
Recurring visual motifs or symbolic representations
Symbolic and Aesthetic Themes

For Visual Connectivity:
1. Provide detailed reasoning.
2. Assign a score out of 10.
3. Provide a concise summary of the reasoning in 10 words or less.

Narrative Connectivity Rubric:
Historical or Cultural Context
Subject Matter (themes, stories, or subjects)
Emotional and Intellectual Resonance
Intended Audience and Purpose

For Narrative Connectivity:
1. Provide detailed reasoning.
2. Assign a score out of 10.
3. Provide a concise summary of the reasoning in 10 words or less.

"""

computation_in_progress = {}
computation_lock = Lock()

def compute_connectivity_scores(artwork_a, artwork_b):
    messages = [
        {
            "role": "system",
            "content": "You are an art expert who evaluates the connectivity between two artworks based on their visual and narrative aspects."
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
                    "visual_connectivity_summary": {"type": "string"},
                    "narrative_reasoning": {"type": "string"},
                    "narrative_connectivity_score": {"type": "number"},
                    "narrative_connectivity_summary": {"type": "string"}
                },
                "required": [
                    "visual_reasoning",
                    "visual_connectivity_score",
                    "visual_connectivity_summary",
                    "narrative_reasoning",
                    "narrative_connectivity_score",
                    "narrative_connectivity_summary"
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
        print(f"Raw response from OpenAI: {response_content}", flush=True)
        connectivity_data = json.loads(response_content)
        return connectivity_data
    except Exception as e:
        print(f"Error computing connectivity scores: {e}", flush=True)
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
            f"exhibition utilisation: {artwork.get('Exhibition Utilisation', '')} "
            f"material: {json.dumps(artwork.get('material', {}))} "
            f"visual context: {json.dumps(artwork.get('visual_context', {}))} "
            f"taxonomy tags: {json.dumps(artwork.get('taxonomy_tags', {}))}"
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
                    visual_connectivity_summary=connectivity_data['visual_connectivity_summary'],
                    narrative_connectivity_score=connectivity_data['narrative_connectivity_score'],
                    narrative_reasoning=connectivity_data['narrative_reasoning'],
                    narrative_connectivity_summary=connectivity_data['narrative_connectivity_summary']
                )
                edge_count += 1
            else:
                print(f"No connectivity data for pair: {a_idx} - {b_idx}", flush=True)

        data = json_graph.node_link_data(G)

        graph_document = {
            "graph": data,
            "created_at": datetime.utcnow(),
            "exhibit_id": str(id)
        }
        result = graph_collection.insert_one(graph_document)

        print(f"Total edges created: {edge_count}", flush=True)

        return jsonify({
            "message": "Pairwise connectivity computed successfully",
            "status": "complete",
            "exhibit_id": str(id),
            "node_count": len(data.get("nodes", [])),
            "link_count": len(data.get("links", [])),
            "graph": data
        }), 200

    except Exception as e:
        print(f"Error computing pairwise for exhibit {id}: {e}", flush=True)
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

@api.route('/exhibits/<id>/add_concepts_subsections', methods=['POST'])
def add_concepts_and_subsections(id):
    try:
        exhibit = create_exhibits.find_one({"_id": ObjectId(id)})
        if not exhibit:
            return jsonify({"error": "Exhibit not found"}), 404

        existing_graph = graph_collection.find_one({"exhibit_id": str(id)})
        if not existing_graph:
            return jsonify({"error": "Graph not found for the exhibit."}), 404

        # Retrieve exhibit-level subsections
        exhibit_subsections = exhibit.get("subsections", [])

        # If the exhibit_subsections appear to be JSON strings, parse them
        # Check if there's exactly one element and that element looks like a JSON array
        if len(exhibit_subsections) == 1 and exhibit_subsections[0].strip().startswith('[') and exhibit_subsections[0].strip().endswith(']'):
            try:
                # Parse the single JSON string into a proper list
                exhibit_subsections = json.loads(exhibit_subsections[0])
            except Exception as e:
                print(f"Error parsing exhibit_subsections JSON string: {e}", flush=True)
                # If parsing fails, just leave them as is or handle error as needed

        graph_data = existing_graph["graph"]
        G = json_graph.node_link_graph(graph_data)
        artworks = exhibit.get("artworks", [])

        for i, artwork in enumerate(tqdm(artworks, desc="Assigning subsections")):
            node_id = str(i)
            if node_id in G.nodes:
                description = (
                    f"description: {artwork.get('Artwork Description', '')} "
                    f"historical significance: {artwork.get('Historical Significance', '')} "
                    f"style significance: {artwork.get('Style Significance', '')} "
                    f"exhibition utilisation: {artwork.get('Exhibition Utilisation', '')} "
                    f"material: {json.dumps(artwork.get('material', {}))} "
                    f"visual context: {json.dumps(artwork.get('visual_context', {}))} "
                    f"taxonomy tags: {json.dumps(artwork.get('taxonomy_tags', {}))}"
                )

                subsections = exhibit_subsections
                print(f"[BACKEND] Processing artwork {i} with exhibit-level subsections: {subsections}", flush=True)

                assigned_subsection = None
                for attempt in range(3):
                    print(f"[BACKEND] Attempt {attempt + 1} for assigning subsection to artwork {i}...", flush=True)
                    try:
                        messages = [
                            {
                                "role": "system",
                                "content": "You are an expert art analyzer. Based on the given description and possible subsections, assign the description to one of the provided subsections."
                            },
                            {
                                "role": "user",
                                "content": json.dumps({
                                    "description": description,
                                    "subsections": subsections
                                })
                            }
                        ]

                        response_format = {
                            "type": "json_schema",
                            "json_schema": {
                                "name": "subsection_assignment_schema",
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "assigned_subsection": {"type": "string"}
                                    },
                                    "required": ["assigned_subsection"],
                                    "additionalProperties": False
                                }
                            }
                        }

                        completion = client.chat.completions.create(
                            model="gpt-4o",
                            messages=messages,
                            response_format=response_format
                        )
                        response_content = json.loads(completion.choices[0].message.content)
                        assigned_subsection = response_content["assigned_subsection"]

                        if assigned_subsection in subsections:
                            G.nodes[node_id]["assigned_subsection"] = assigned_subsection
                            print(f"[BACKEND] Assigned subsection '{assigned_subsection}' to artwork {i}", flush=True)
                            break
                        else:
                            print(f"[BACKEND] Assigned subsection '{assigned_subsection}' is not in the provided list for artwork {i}. Retrying...", flush=True)
                    except Exception as e:
                        print(f"[BACKEND] Attempt {attempt + 1} failed for artwork {node_id} with GPT-4 API: {e}", flush=True)

                if assigned_subsection is None:
                    print(f"[BACKEND] Failed to assign a valid subsection for artwork {node_id} after 3 attempts.", flush=True)

        updated_graph_data = json_graph.node_link_data(G)
        graph_collection.update_one(
            {"_id": existing_graph["_id"]},
            {"$set": {"graph": updated_graph_data}}
        )

        return jsonify({"message": "Concepts and subsections processed and updated successfully."}), 200

    except Exception as e:
        print(f"Error adding concepts and subsections for exhibit {id}: {e}", flush=True)
        return jsonify({"error": "Internal server error"}), 500

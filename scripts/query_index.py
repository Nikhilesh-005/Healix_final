
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import sys
import os

# Configuration
INDEX_DIR = "data/vector_store"
MODEL_NAME = "all-mpnet-base-v2"
INDEX_PATH = os.path.join(INDEX_DIR, "mental_health.index")
METADATA_PATH = os.path.join(INDEX_DIR, "metadata.json")

def main():
    if len(sys.argv) < 2:
        print("Usage: python query_index.py 'query string'")
        sys.exit(1)
        
    query_text = sys.argv[1]
    
    # Load resources
    # Suppress warnings to keep stdout clean for Node.js
    validation_path = os.path.join(os.getcwd(), INDEX_PATH)
    if not os.path.exists(validation_path):
         # Try looking relative to script location if cwd is different
         script_dir = os.path.dirname(os.path.abspath(__file__))
         validation_path = os.path.join(script_dir, "..", INDEX_PATH)
    
    if not os.path.exists(validation_path) and not os.path.exists(INDEX_PATH):
        # Fail gracefully if index doesn't exist yet
        print(json.dumps({"error": "Index not found", "matches": []}))
        return

    # Load Model (this is the slow part ~1-2s)
    model = SentenceTransformer(MODEL_NAME)
    
    # Load Index
    # Determine correct path based on where script is called from
    try:
        index = faiss.read_index(INDEX_PATH)
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except:
        # Fallback for relative paths
        try:
            base_path = os.path.join(os.path.dirname(__file__), "..")
            idx_p = os.path.join(base_path, INDEX_PATH)
            meta_p = os.path.join(base_path, METADATA_PATH)
            index = faiss.read_index(idx_p)
            with open(meta_p, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        except Exception as e:
            print(json.dumps({"error": str(e), "matches": []}))
            sys.exit(1)

    # Search
    query_embedding = model.encode([query_text])
    k = 3 # Number of results
    distances, indices = index.search(np.array(query_embedding).astype('float32'), k)
    
    results = []
    for i, idx in enumerate(indices[0]):
        if idx < len(metadata) and idx >= 0:
            item = metadata[idx]
            results.append({
                "distance": float(distances[0][i]),
                "text": item['text'],
                "metadata": item['metadata']
            })
            
    # Output JSON for Node.js to parse
    print(json.dumps({"matches": results}))

if __name__ == "__main__":
    main()

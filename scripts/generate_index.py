
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import sys

# Configuration
DATA_PATH = "../../mental_data.json"  # Relative to scripts/ folder
INDEX_DIR = "data/vector_store"
MODEL_NAME = "all-mpnet-base-v2"

def main():
    print(f"Loading data from {DATA_PATH}...")
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {DATA_PATH}")
        # Try absolute path fallback if running from root
        try:
            with open('../mental_data.json', 'r', encoding='utf-8') as f:
                 data = json.load(f)
        except:
             print("Could not find mental_data.json in ../ or ../../")
             sys.exit(1)

    documents = []
    
    # Process intents
    print("Processing intents...")
    for intent in data.get('intents', []):
        tag = intent.get('tag', 'general')
        patterns = intent.get('patterns', [])
        responses = intent.get('responses', [])
        
        # We want to retrieve based on what the user SAYS (patterns) 
        # but provide the context of the RESPONSE or the intent itself.
        # Strategy: Embed the patterns. Store the associated responses as metadata.
        
        for pattern in patterns:
            if pattern:
                documents.append({
                    "text": pattern,
                    "metadata": {
                        "tag": tag,
                        "responses": responses,
                        "matched_pattern": pattern
                    }
                })

    print(f"Found {len(documents)} document chunks.")

    # Generate Embeddings
    print(f"Loading model {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    
    print("Generating embeddings...")
    texts = [doc['text'] for doc in documents]
    embeddings = model.encode(texts, show_progress_bar=True)
    
    # Create Index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings).astype('float32'))
    
    # Save Index and Metadata
    os.makedirs(INDEX_DIR, exist_ok=True)
    index_path = os.path.join(INDEX_DIR, "mental_health.index")
    metadata_path = os.path.join(INDEX_DIR, "metadata.json")
    
    print(f"Saving index to {index_path}...")
    faiss.write_index(index, index_path)
    
    print(f"Saving metadata to {metadata_path}...")
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(documents, f, indent=2)
        
    print("Done!")

if __name__ == "__main__":
    main()

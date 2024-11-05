import os
import requests
import numpy as np
from pinecone import Pinecone, ServerlessSpec
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Configuration
API_URL = "http://tormenta.ing.puc.cl/api/embed"
HEADERS = {"Content-Type": "application/json"}
TEXT_DIR = "clean_scripts"  # Directory containing text files

pc = Pinecone(api_key="")
INDEX_NAME = 'scripts'


# Split text using LangChain
def split_text(text: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=20)
    return splitter.split_text(text)

# Send POST request to the API to get embeddings
def get_embedding(text: str):
    payload = {"model": "nomic-embed-text", "input": text}
    response = requests.post(API_URL, json=payload, headers=HEADERS)
    if response.status_code == 200:
        return response.json()["embeddings"][0]
    else:
        raise Exception(f"API Error: {response.text}")

# Check if a vector ID already exists in the Pinecone index
def vector_exists(index, vector_id: str):
    response = index.fetch([vector_id])
    return vector_id in response['vectors']

# Process a single file: Split, embed, and store
def process_file(filename, index):
    print(f"Processing file: {filename}")
    
    with open(os.path.join(TEXT_DIR, filename), 'r', encoding='utf-8') as f:
        text = f.read()

    chunks = split_text(text)
    batch_size = 10
    print(f"Split into {len(chunks)} chunks.")

    items_to_upsert = []

    for i, chunk in enumerate(chunks):
        vector_id = f"{filename}_{i}"

        """ index.update(
            id=vector_id,
            set_metadata={"movie": filename, "text": chunk},
        ) """
        # Check if vector already exists before generating embeddings
        if vector_exists(index, vector_id):
            print(f"Vector {vector_id} already exists, skipping.")
            continue

        # Get embedding only for new vectors
        embedding = get_embedding(chunk)
        items_to_upsert.append((vector_id, embedding))
        
        # Upsert in batches
        if len(items_to_upsert) >= batch_size:
            index.upsert(items_to_upsert)
            print(f"Upserted batch of {len(items_to_upsert)} embeddings to the Pinecone index.")
            items_to_upsert = []

    # Upsert any remaining items
    if items_to_upsert:
        index.upsert(items_to_upsert)
        print(f"Upserted final batch of {len(items_to_upsert)} embeddings to the Pinecone index.")

    print(f"Finished processing file: {filename}")


# Main function to process all files in the directory
def main():
    # Initialize index
    index = pc.Index('scripts')


    # Process each text file in the directory
    for filename in os.listdir(TEXT_DIR):
        if filename.endswith(".txt"):
            process_file(filename, index)

    print("All files processed and embeddings stored successfully.")

# Run the script
if __name__ == "__main__":
    main()

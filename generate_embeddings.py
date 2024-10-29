import os
import requests
import numpy as np
from pinecone import Pinecone, ServerlessSpec
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Configuration
API_URL = "https://tormenta.ing.puc.cl/api/embed"
HEADERS = {"Content-Type": "application/json"}
TEXT_DIR = "clean_scripts"  # Directory containing text files

pc = Pinecone(api_key="")
INDEX_NAME = 'scripts'

def initialize_faiss_index(embedding_dim: int):
    if INDEX_NAME not in pc.list_indexes():
        pc.create_index(
            name=INDEX_NAME,
            dimension=embedding_dim,  # Replace with your model dimensions
            metric="cosine",  # Replace with your model metric
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    return pc.Index(INDEX_NAME)

# Split text using LangChain
def split_text(text: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    return splitter.split_text(text)

# Send POST request to the API to get embeddings
def get_embedding(text: str):
    payload = {"model": "nomic-embed-text", "input": text}
    response = requests.post(API_URL, json=payload, headers=HEADERS)
    if response.status_code == 200:
        return response.json()["embeddings"][0]
    else:
        raise Exception(f"API Error: {response.text}")

# Process a single file: Split, embed, and store
def process_file(filename, index):
    print(f"Processing file: {filename}")
    
    with open(os.path.join(TEXT_DIR, filename), 'r', encoding='utf-8') as f:
        text = f.read()

    chunks = split_text(text)
    print(f"Split into {len(chunks)} chunks.")

    embeddings = [get_embedding(chunk) for chunk in chunks]
    
    items_to_upsert = [(f"{filename}_{i}", embedding) for i, embedding in enumerate(embeddings)]

    index.upsert(items_to_upsert)
    print(f"Added {len(embeddings)} embeddings to the Pinecone index.")


# Main function to process all files in the directory
def main():
    # Initialize FAISS index
    index = initialize_index(718)

    # Process each text file in the directory
    for filename in os.listdir(TEXT_DIR):
        if filename.endswith(".txt"):
            process_file(filename, index)

    print("All files processed and embeddings stored successfully.")

# Run the script
if __name__ == "__main__":
    main()

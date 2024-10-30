'use server'

import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || ''
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || '';

export async function POST(req: NextRequest, res: NextResponse) {
    const { query } = await req.json();
  
    try {
        // Retrieve context from the Pinecone index based on the query
        const context = await fetchContextFromPinecone(query);

        // Send the context and the query to the LLM model
        const response = await fetch('https://tormenta.ing.puc.cl/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'integra-LLM',
                prompt: query,
                context: context,
                stream: false
            }),
        });

        const data = await response.json();
        // Return the response from the LLM model
        return NextResponse.json(data.response, { status: 200 });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Function to fetch context from Pinecone based on the query
async function fetchContextFromPinecone(query: string) {
    // Create an embedding for the query using your preferred method (e.g., OpenAI embeddings)
    const queryEmbedding = await getQueryEmbedding(query); // Implement this function to get embeddings

    // Query Pinecone for similar vectors
    if (!INDEX_NAME) {
        throw new Error("Pinecone index name is not defined.");
    }
    const index = pinecone.index(INDEX_NAME);
    const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 5, // Adjust this based on how many results you want
        includeMetadata: true,
    });

    // Extract relevant context from the response
    if (queryResponse.matches.length > 0) {
        return queryResponse.matches.map(match => match.metadata); // Adjust based on your metadata structure
    } else {
        return "No relevant context found.";
    }
}

// Placeholder function for getting query embeddings (implement as needed)
async function getQueryEmbedding(query: string) {
    // Here you would typically call your embedding service/API to convert the query into a vector
    // For example, using OpenAI's embedding API:
    
    const response = await fetch('https://tormenta.ing.puc.cl/api/embed', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Your OpenAI API key
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: "nomic-embed-text", // Replace with your chosen model
            input: query,
        }),
    });

    const data = await response.json();
    return data.data.embeddings; // Adjust based on your embedding response structure
}
'use server'

import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Stream } from 'stream';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || ''
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || '';


export async function POST(req: NextRequest) {
    const configuration = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const { message, movie } = await req.json();
    const model = configuration.getGenerativeModel({ model: 'gemini-pro' });
  
    try {
        // Retrieve context from the Pinecone index based on the query
        const context = await fetchContextFromPinecone(message, movie) as { movie: string, text: string }[];

        const formattedContext = context.map(
            ({ movie, text }) => `Text: ${text}`
        ).join('\n\n');

        const prompt = `
        You are a knowledgeable assistant. Use the provided context to answer the user’s query as accurately as possible. If the context does not directly address the query, provide the best answer based on your general knowledge.

        Context:
        Movie: ${movie}
        ${formattedContext}

        Query:
        ${message}

        Answer:
        `;

        console.log("Prompt:", prompt);

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return new NextResponse(text, { status: 200 } );

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Function to fetch context from Pinecone based on the query
async function fetchContextFromPinecone(query: string, movie: string) {
    // Create an embedding for the query using your preferred method (e.g., OpenAI embeddings)
    const queryEmbedding = await getQueryEmbedding(query); // Implement this function to get embeddings

    // Query Pinecone for similar vectors
    if (!INDEX_NAME) {
        throw new Error("Pinecone index name is not defined.");
    }
    const index = pinecone.index(INDEX_NAME);
    const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 10, // Adjust this based on how many results you want
        includeMetadata: true,
        filter: {
            "movie": {"$eq": movie}
        }
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
    
    const response = await fetch('http://tormenta.ing.puc.cl/api/embed', {
        method: 'POST',
        headers: { // Your OpenAI API key
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: "nomic-embed-text", // Replace with your chosen model
            input: query,
        }),
    });

    const data = await response.json();

    return data.embeddings[0] as number[]; // Adjust based on your embedding response structure
}
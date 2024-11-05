'use server'

import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || ''
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || '';

export async function POST(req: NextRequest) {
    const { message } = await req.json();

  
    try {
        // Retrieve context from the Pinecone index based on the query
        /* const context = await fetchContextFromPinecone(message) as { movie: string, text: string }[]; */

        // Send the context and the query to the LLM model
        const response = await fetch('http://tormenta.ing.puc.cl/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'integra-LLM',
                prompt: message,
                /* context: `Use the following pieces of context to answer the users question. 
                    If you don't know the answer, just say that you don't know, don't try to make up an answer.
                    
                    ${context.map(c => `${c.movie}: ${c.text}`).join('\n')}`, */
                stream: true
            }),
        });

        console.log(response);

        const stream = new ReadableStream({
            async start(controller) {
                if (!response.body) {
                    throw new Error("Response body is null");
                }
                const reader = response.body.getReader();

                // Read chunks from the model's response and enqueue them to the stream
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Push each chunk to the controller
                    controller.enqueue(value);
                }
                controller.close();
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
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
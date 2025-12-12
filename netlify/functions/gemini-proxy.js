// Netlify serverless function to securely proxy requests to the Gemini API.
// It uses the GEMINI_API_KEY environment variable set in Netlify.

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

exports.handler = async (event, context) => {
    // --- DIAGNOSTIC LOGGING START ---
    console.log("--- Netlify Function Execution Started ---");
    // --- DIAGNOSTIC LOGGING END ---
    
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // Retrieve the secure API key from Netlify's environment variables
    // This key must be set in your Netlify site settings as GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        // --- DIAGNOSTIC LOGGING ---
        console.error('CRITICAL ERROR: GEMINI_API_KEY is not set in Netlify environment variables.');
        // ---
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY not set.' }),
        };
    }
    
    // --- DIAGNOSTIC LOGGING ---
    console.log('API Key presence confirmed.');
    // ---

    // Parse the request body from the client (contains chat history, system prompt, etc.)
    let payload;
    try {
        payload = JSON.parse(event.body);
        // --- DIAGNOSTIC LOGGING ---
        console.log('Received payload:', JSON.stringify(payload, null, 2));
        // ---
    } catch (e) {
        console.error('Error parsing JSON payload:', e);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON payload.' }),
        };
    }

    // Construct the full API URL with the secured key
    const url = `${GEMINI_API_URL}?key=${apiKey}`;

    try {
        // Forward the request to the official Google API endpoint
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            // --- DIAGNOSTIC LOGGING ---
            console.error(`Gemini API returned status ${response.status}. Error data:`, JSON.stringify(data));
            // ---
            // Forward API errors back to the client
            return {
                statusCode: response.status,
                body: JSON.stringify(data),
            };
        }

        // --- DIAGNOSTIC LOGGING ---
        console.log('Gemini API call successful. Returning response.');
        // ---
        
        // Send the successful response data back to the client
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error("Proxy Fetch Error (Network or Timeout):", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error during API call.' }),
        };
    } finally {
        console.log("--- Netlify Function Execution Finished ---");
    }
};
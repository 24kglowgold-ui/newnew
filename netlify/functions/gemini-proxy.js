// Netlify serverless function to securely proxy requests to the Gemini API.
// It uses the GEMINI_API_KEY environment variable set in Netlify.

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // Retrieve the secure API key from Netlify's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY not set.' }),
        };
    }

    // Parse the request body from the client (contains chat history, system prompt, etc.)
    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch (e) {
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
            // Forward API errors back to the client
            return {
                statusCode: response.status,
                body: JSON.stringify(data),
            };
        }

        // Send the successful response data back to the client
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error("Proxy Fetch Error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error during API call.', details: error.message }),
        };
    }
};
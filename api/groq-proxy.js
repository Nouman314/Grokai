// api/groq-proxy.js (This goes in your separate Vercel project's 'api' folder)
import Groq from 'groq-sdk';

export default async function handler(req, res) {
    // !! IMPORTANT !! REPLACE 'YOUR_EXTENSION_ID' WITH YOUR ACTUAL CHROME EXTENSION ID
    // You get this ID after you first load your extension in Chrome Developer Mode (chrome://extensions)
    res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://YOUR_EXTENSION_ID');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { text, action } = req.body;

    if (!text || !action) {
        return res.status(400).json({ message: 'Missing text or action in request body.' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
        console.error('SERVER ERROR: GROQ_API_KEY is not set in environment variables.');
        return res.status(500).json({ message: 'Server configuration error: API key missing.' });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    let prompt = '';
    let model = 'mixtral-8x7b-32768';

    switch (action) {
        case 'fixGrammar':
            prompt = `Please fix the grammar and spelling in the following text:\n\n"${text}"`;
            break;
        case 'paraphrase':
            prompt = `Please paraphrase the following text, making sure to retain its original meaning but using different wording:\n\n"${text}"`;
            break;
        case 'summarize':
            prompt = `Please summarize the following text concisely:\n\n"${text}"`;
            break;
        default:
            return res.status(400).json({ message: 'Invalid action specified. Supported actions: fixGrammar, paraphrase, summarize.' });
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            temperature: 0.7,
            max_tokens: 1000,
        });

        const result = chatCompletion.choices[0].message.content;

        return res.status(200).json({ result });

    } catch (error) {
        console.error('Error calling Groq API from serverless function:', error);
        return res.status(500).json({ message: 'Error processing text with AI. Please try again later.' });
    }
}
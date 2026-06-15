/**
 * {
 *   "name": "Nova AI Chat",
 *   "category": "ai",
 *   "endpoint": "/api/ai/chat",
 *   "method": "GET",
 *   "description": "Chat dengan Nova AI melalui external API",
 *   "params": [
 *     {
 *       "name": "text",
 *       "required": true,
 *       "description": "Pesan yang ingin dikirim ke AI"
 *     }
 *   ]
 * }
 */

import { Request, Response } from 'express';

const headers = {
    'User-Agent': 'okhttp/4.10.0',
    'Accept-Encoding': 'gzip',
    'platform': 'Android',
    'version': '1.4.0',
    'language': 'in',
    'content-type': 'application/json; charset=utf-8'
};

async function novaAi(text: string) {
    const payload = {
        question_text: text,
        conversation: {
            conversation_items: []
        }
    };

    const res = await fetch('https://us-central1-nova-ai---android.cloudfunctions.net/app/ai-response/v2', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`External API returned ${res.status}`);
    }

    return await res.json();
}

export default async function (req: Request, res: Response) {
    const text = req.query.text;

    // Validasi: harus ada dan harus string
    if (!text || typeof text !== 'string') {
        return res.status(400).json({
            status: false,
            message: "Parameter 'text' is required and must be a string!"
        });
    }

    try {
        const data = await novaAi(text);

        res.json({
            status: true,
            result: data
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred";
        res.status(500).json({
            status: false,
            message
        });
    }
}
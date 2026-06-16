/**
 * {
 *   "name": "Chatday AI",
 *   "category": "ai",
 *   "endpoint": "/api/ai/chatday",
 *   "method": "GET",
 *   "description": "Chatday AI — Multi model AI dengan 24 pilihan model (1 req/detik)",
 *   "params": [
 *     {
 *       "name": "prompt",
 *       "required": true,
 *       "description": "Pertanyaan untuk AI"
 *     },
 *     {
 *       "name": "model",
 *       "required": false,
 *       "description": "Pilih model AI (default: openai/gpt-5.5)"
 *     }
 *   ]
 * }
 */

import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';

// Creator info untuk setiap endpoint
const CREATOR = "Epann";

function uuidv4(): string {
  return crypto.randomUUID();
}

function removeKeysRecursive(obj: any, keys: string[]): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(v => removeKeysRecursive(v, keys));
  const cleaned: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!keys.includes(k.toLowerCase())) cleaned[k] = removeKeysRecursive(v, keys);
  }
  return cleaned;
}

export default async function (req: Request, res: Response) {
  const prompt = String(req.query.prompt || '').trim();
  const model = String(req.query.model || 'openai/gpt-5.5').trim();

  if (!prompt) {
    return res.status(400).json({ 
      status: false, 
      creator: CREATOR,
      result: 'Parameter prompt wajib diisi' 
    });
  }

  const base_url = 'https://www.chatday.ai';

  try {
    // Anonymous Sign In
    const loginRes = await axios.post(`${base_url}/api/auth/sign-in/anonymous`, {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'Origin': base_url,
        'Referer': `${base_url}/chat`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const cookies = (loginRes.headers['set-cookie'] || []).map((c: string) => c.split(';')[0]);
    const cookie = cookies.join('; ');

    const visitorId = uuidv4().replace(/-/g, '');
    const conversationId = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Chat
    const chatRes = await axios.post(`${base_url}/api/v2/chat/anonymous`, {
      content: prompt,
      model,
      visitorId,
      conversationId
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'Origin': base_url,
        'Referer': `${base_url}/chat`,
        'Content-Type': 'application/json',
        'Cookie': cookie,
        'Accept': 'text/event-stream'
      },
      timeout: 60000,
      responseType: 'text'
    });

    let answer = '';
    for (const line of chatRes.data.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        const evt = JSON.parse(json);
        if (evt.type === 'text-delta' && evt.delta) {
          answer += evt.delta;
        }
      } catch (e) {}
    }

    const result = removeKeysRecursive({ model, response: answer }, ['creator', 'author']);

    return res.json({ 
      status: true, 
      creator: CREATOR,  // ✅ Creator ditambahkan di response
      result 
    });
  } catch (err: any) {
    return res.status(500).json({ 
      status: false, 
      creator: CREATOR,  // ✅ Creator ditambahkan di response error
      result: err.message 
    });
  }
};
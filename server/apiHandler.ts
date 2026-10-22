import type { IncomingMessage, ServerResponse } from 'http';
import {
  generateCharacterChat,
  generateCharacterDetails,
  generateCharacterSpeech,
  generateCharacterImage,
} from './geminiService.ts';

// Helper to parse JSON body from incoming Node.js request
function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protect against overly large payloads (max 10MB for images)
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void
): Promise<void> {
  const url = req.url || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Health check
  if (url === '/api/health' || url.startsWith('/api/health?')) {
    sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
    return;
  }

  // Character Chat
  if (url === '/api/chat' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { character, messages, currentMood, userLanguage, userImage } = body;
      
      if (!character || !messages) {
        sendJson(res, 400, { error: 'Character and messages are required' });
        return;
      }

      const result = await generateCharacterChat({
        character,
        messages,
        currentMood: currentMood || 'happy',
        userLanguage: userLanguage || 'my',
        userImage,
      });

      sendJson(res, 200, result);
    } catch (error: any) {
      console.error('Chat error:', error);
      sendJson(res, 500, { error: error?.message || 'Failed to generate chat response' });
    }
    return;
  }

  // Text-To-Speech (Gemini TTS)
  if (url === '/api/speech' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { text, voiceName } = body;

      if (!text) {
        sendJson(res, 400, { error: 'Text is required for speech' });
        return;
      }

      const audioBase64 = await generateCharacterSpeech({
        text,
        voiceName: voiceName || 'Kore',
      });

      if (!audioBase64) {
        sendJson(res, 503, { error: 'Audio synthesis unavailable' });
        return;
      }

      sendJson(res, 200, { audioBase64, mimeType: 'audio/wav' });
    } catch (error: any) {
      console.error('Speech error:', error);
      sendJson(res, 500, { error: error?.message || 'Failed to synthesize speech' });
    }
    return;
  }

  // Character Avatar / Image Generation
  if (url === '/api/image' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { prompt, style } = body;

      if (!prompt) {
        sendJson(res, 400, { error: 'Prompt is required' });
        return;
      }

      const imageUrl = await generateCharacterImage({
        prompt,
        style: style || 'cinematic',
      });

      sendJson(res, 200, { imageUrl });
    } catch (error: any) {
      console.error('Image generation error:', error);
      sendJson(res, 500, { error: error?.message || 'Failed to generate image' });
    }
    return;
  }

  // Character Auto-Designer
  if (url === '/api/generate-character' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { prompt, gender, relationship, language } = body;

      const characterData = await generateCharacterDetails({
        prompt: prompt || 'A charming and loyal companion',
        gender: gender || 'any',
        relationship: relationship || 'friend',
        language: language || 'my',
      });

      sendJson(res, 200, characterData);
    } catch (error: any) {
      console.error('Generate character error:', error);
      sendJson(res, 500, { error: error?.message || 'Failed to generate character' });
    }
    return;
  }

  if (next) {
    next();
  } else {
    sendJson(res, 404, { error: 'Not found' });
  }
}

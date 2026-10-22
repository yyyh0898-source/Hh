import { Character } from '../types/character.ts';
import { ChatMessage } from '../types/chat.ts';

export async function sendChatMessage({
  character,
  messages,
  currentMood,
  userLanguage = 'my',
  userImage,
}: {
  character: Character;
  messages: ChatMessage[];
  currentMood: string;
  userLanguage?: 'my' | 'en';
  userImage?: { mimeType: string; base64Data: string };
}) {
  const payloadMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      character: {
        id: character.id,
        name: character.name,
        burmeseName: character.burmeseName,
        gender: character.gender,
        age: character.age,
        relationship: character.relationship,
        personality: character.personality,
        backstory: character.backstory,
        scenario: character.scenario,
        speakingStyle: character.speakingStyle,
        voiceName: character.voiceName,
      },
      messages: payloadMessages,
      currentMood,
      userLanguage,
      userImage,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with ${res.status}`);
  }

  return await res.json();
}

export async function requestSpeechSynthesis({
  text,
  voiceName = 'Kore',
}: {
  text: string;
  voiceName?: string;
}): Promise<string | null> {
  try {
    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.audioBase64 || null;
  } catch (e) {
    console.warn('Speech synthesis call failed:', e);
    return null;
  }
}

export async function requestImageGeneration({
  prompt,
  style = 'cinematic',
}: {
  prompt: string;
  style?: string;
}): Promise<string | null> {
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate image');
  }

  const data = await res.json();
  return data.imageUrl || null;
}

export async function requestCharacterGeneration({
  prompt,
  gender,
  relationship,
  language = 'my',
}: {
  prompt: string;
  gender: string;
  relationship: string;
  language?: 'my' | 'en';
}) {
  const res = await fetch('/api/generate-character', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, gender, relationship, language }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate character');
  }

  return await res.json();
}

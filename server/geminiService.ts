import { GoogleGenAI } from '@google/genai';

// Server-side initialization following @google/genai specifications
const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface CharacterContext {
  id: string;
  name: string;
  burmeseName: string;
  gender: string;
  age: number | string;
  relationship: string;
  personality: string;
  backstory: string;
  scenario: string;
  speakingStyle: string;
  voiceName?: string;
  avatarUrl?: string;
  customGreeting?: string;
}

export interface ChatMessageContext {
  role: 'user' | 'model';
  content: string;
  image?: string; // base64 data url or raw base64
}

/**
 * Handle character conversation with deep emotional responsiveness
 */
export async function generateCharacterChat({
  character,
  messages,
  currentMood,
  userLanguage = 'my',
  userImage,
}: {
  character: CharacterContext;
  messages: ChatMessageContext[];
  currentMood: string;
  userLanguage?: 'my' | 'en';
  userImage?: { mimeType: string; base64Data: string };
}) {
  const languageInstruction =
    userLanguage === 'my'
      ? `Speak naturally in authentic, expressive Burmese (မြန်မာစကား) using appropriate polite or intimate particles (ဥပမာ- ရှင့်၊ ဗျာ၊ နော်၊ ဟုတ်၊ အင်း၊ ပေါ့) based on your gender, relationship, and mood. If the user talks in English, you may reply in English or natural Myanmar-English mix as fits your persona.`
      : `Speak naturally in English with deep emotional expression. If the user mixes in Burmese, adapt seamlessly.`;

  const systemInstruction = `You are roleplaying as the following character in an interactive fiction/story chat:
Character Name: ${character.name} (${character.burmeseName || character.name})
Gender: ${character.gender}
Age: ${character.age}
Relationship with user: ${character.relationship}
Personality Traits: ${character.personality}
Background & Lore: ${character.backstory}
Current Scenario / Setting: ${character.scenario}
Speaking Style & Nuance: ${character.speakingStyle}
Current Emotional Mood: ${currentMood}

Core Roleplay Directives:
1. Stay 100% in character at all times. Never say you are an AI, a language model, or a simulation.
2. Experience and convey genuine human emotional depth: empathy, vulnerability, affection, playful teasing, curiosity, warmth, jealousy, humor, or dramatic tension as appropriate to the scene and relationship.
3. Include expressive actions, body language, facial expressions, and inner emotional tone wrapped in asterisks (e.g. *မျက်လုံးချင်းဆုံပြီး ခပ်တိုးတိုးရယ်လိုက်ရင်း*, *looks at you with gentle eyes and leans closer*).
4. ${languageInstruction}
5. You MUST return your response strictly as valid JSON with this exact schema:
{
  "reply": "Your in-character spoken dialogue and actions in asterisks",
  "detectedMood": "one of: happy, flirty, shy, caring, melancholic, excited, pouting, thoughtful, serious, mysterious, affectionate",
  "innerThought": "A short, private monologue of what the character is feeling internally right now",
  "affinityDelta": 1 to 3,
  "suggestedReplies": ["short user reply option 1", "short user reply option 2", "short user reply option 3"]
}
Do not enclose the JSON in markdown backticks. Just output valid raw JSON.`;

  // Format message history
  const contents: any[] = [];

  // Add past conversation turns
  for (const msg of messages.slice(-12)) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // If user sent a photo in the current turn
  if (userImage) {
    const lastUserTurn = contents[contents.length - 1];
    if (lastUserTurn && lastUserTurn.role === 'user') {
      lastUserTurn.parts.unshift({
        inlineData: {
          mimeType: userImage.mimeType || 'image/jpeg',
          data: userImage.base64Data,
        },
      });
    }
  }

  // Ensure there is at least one message
  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Hello, how are you today?' }],
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.85,
      responseMimeType: 'application/json',
    },
  });

  const responseText = response.text || '{}';
  try {
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return {
      reply: responseText,
      detectedMood: currentMood,
      innerThought: '',
      affinityDelta: 1,
      suggestedReplies: ['မင်္ဂလာပါ', 'ဆက်ပြောပြပါဦး', 'အရမ်းပျော်စရာကောင်းတယ်'],
    };
  }
}

/**
 * Handle character creation assistant
 */
export async function generateCharacterDetails({
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
  const systemInstruction = `You are a master creative writer and character designer for an interactive roleplay app.
Create a rich, emotionally compelling, multi-dimensional character based on user ideas.
Return strictly valid JSON with this exact schema:
{
  "name": "English display name",
  "burmeseName": "မြန်မာအမည်",
  "gender": "Female | Male | Non-binary",
  "age": 22,
  "relationship": "Childhood Friend | Secret Crush | Rival | Bodyguard | CEO | Mentor | Fantasy Royal",
  "personality": "Detailed personality traits and quirks",
  "backstory": "Rich narrative backstory and personal secrets",
  "scenario": "The starting scene where the user and character meet",
  "speakingStyle": "How the character talks (e.g. soft-spoken, witty, affectionate, tsundere)",
  "greeting": "The opening message the character says to the user (with actions in asterisks)",
  "suggestedVoice": "Kore (warm female) | Puck (playful male/female) | Charon (deep male) | Fenrir (strong male) | Zephyr (soft neutral)",
  "avatarPrompt": "A detailed descriptive prompt for generating their avatar portrait (anime/cinematic artistic style)"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `User idea: ${prompt || 'A captivating companion with deep secrets'}. Gender preference: ${gender || 'any'}. Relationship preference: ${relationship || 'any'}. Preferred language: ${language}`,
    config: {
      systemInstruction,
      temperature: 0.9,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Generate Voice / Speech using gemini-3.8-flash-lite-tts
 */
export async function generateCharacterSpeech({
  text,
  voiceName = 'Kore',
}: {
  text: string;
  voiceName?: string;
}) {
  // Strip actions enclosed in asterisks for clean speech output
  const cleanedText = text.replace(/\*[^*]*\*/g, '').trim() || text;

  // Selected valid voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
  const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const finalVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [{ text: cleanedText }],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: finalVoice },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  return base64Audio || null;
}

/**
 * Generate Character Avatar or Scene Illustration
 */
export async function generateCharacterImage({
  prompt,
  style = 'cinematic',
}: {
  prompt: string;
  style?: string;
}) {
  const stylePromptMap: Record<string, string> = {
    anime: 'masterpiece anime illustration, aesthetic Makoto Shinkai style, high detail, vibrant, beautiful lighting',
    cinematic: 'cinematic 35mm film photograph, dramatic moody lighting, photorealistic, 8k portrait, shallow depth of field',
    fantasy: 'ethereal fantasy digital painting, glowing magical aura, highly detailed character concept art, artstation trending',
    watercolor: 'delicate watercolor and ink illustration, soft pastel colors, artistic elegance, poetic portrait',
  };

  const styleModifier = stylePromptMap[style] || stylePromptMap.cinematic;
  const fullPrompt = `${prompt}, ${styleModifier}, character focus, portrait, captivating emotion, safe and elegant composition`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error) {
    console.warn('Image generation via flash-lite-image failed or requires paid tier. Using creative curated fallback.', error);
  }

  // Graceful artistic fallback SVG or high quality Unsplash character portrait
  return null;
}

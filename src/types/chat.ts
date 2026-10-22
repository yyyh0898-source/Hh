import { MoodType } from './character.ts';

export interface ChatMessage {
  id: string;
  characterId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  image?: string; // base64 or URL attached by user or sent by AI
  audioBase64?: string; // cached synthesized voice
  detectedMood?: MoodType;
  innerThought?: string;
  suggestedReplies?: string[];
  isError?: boolean;
}

export interface ChatSession {
  characterId: string;
  messages: ChatMessage[];
  lastMessageTime: number;
  unreadCount?: number;
}

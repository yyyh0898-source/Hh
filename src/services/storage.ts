import { Character, AppSettings } from '../types/character.ts';
import { ChatMessage } from '../types/chat.ts';
import { DEFAULT_CHARACTERS } from '../data/defaultCharacters.ts';

const STORAGE_KEYS = {
  CHARACTERS: 'character_ai_characters_v2',
  MESSAGES_PREFIX: 'character_ai_messages_v2_',
  SETTINGS: 'character_ai_settings_v2',
  ACTIVE_CHARACTER: 'character_ai_active_char_v2',
  IS_LOCKED: 'character_ai_is_locked_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'my',
  theme: 'dark',
  themeAccent: 'rose',
  autoPlayVoice: false,
  speechEngine: 'gemini',
  voiceSpeed: 1.0,
  lastCloudSync: Date.now() - 3600000,
  security: {
    isLockEnabled: false,
    pin: '',
    useBiometrics: true,
    autoLockMinutes: 5,
  },
};

export class StorageService {
  // Characters
  static getCharacters(): Character[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
      if (!data) {
        this.saveCharacters(DEFAULT_CHARACTERS);
        return DEFAULT_CHARACTERS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load characters from storage:', e);
      return DEFAULT_CHARACTERS;
    }
  }

  static saveCharacters(characters: Character[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
    } catch (e) {
      console.error('Failed to save characters:', e);
    }
  }

  static saveCharacter(character: Character): void {
    const chars = this.getCharacters();
    const idx = chars.findIndex((c) => c.id === character.id);
    if (idx >= 0) {
      chars[idx] = { ...character, updatedAt: Date.now() };
    } else {
      chars.unshift({ ...character, createdAt: Date.now(), updatedAt: Date.now() });
    }
    this.saveCharacters(chars);
  }

  static deleteCharacter(id: string): void {
    const chars = this.getCharacters().filter((c) => c.id !== id);
    this.saveCharacters(chars);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES_PREFIX + id);
  }

  // Active Character
  static getActiveCharacterId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHARACTER) || DEFAULT_CHARACTERS[0].id;
  }

  static setActiveCharacterId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHARACTER, id);
  }

  // Messages per Character
  static getMessages(characterId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES_PREFIX + characterId);
      if (!data) {
        // Find character and populate initial greeting
        const chars = this.getCharacters();
        const char = chars.find((c) => c.id === characterId);
        if (char && char.greeting) {
          const initialGreeting: ChatMessage = {
            id: 'init-' + characterId,
            characterId,
            role: 'model',
            content: char.greeting,
            timestamp: char.createdAt || Date.now(),
            detectedMood: char.currentMood,
            innerThought: 'သင်နှင့် စကားစပြောနိုင်ခွင့်ရသည့်အတွက် ရင်ထဲတွင် ကြည်နူးလှိုက်မောနေပါသည်...',
            suggestedReplies: [
              'မင်္ဂလာပါ... မင်းကို အရမ်းလွမ်းနေတာ',
              'ဒီနေ့ အဆင်ပြေရဲ့လားဟင်?',
              'မင်းအနားမှာ ရှိနေရတာ အရမ်းနွေးထွေးတယ်',
            ],
          };
          this.saveMessages(characterId, [initialGreeting]);
          return [initialGreeting];
        }
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
      return [];
    }
  }

  static saveMessages(characterId: string, messages: ChatMessage[]): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.MESSAGES_PREFIX + characterId,
        JSON.stringify(messages)
      );
    } catch (e) {
      console.error('Failed to save messages:', e);
    }
  }

  static clearMessages(characterId: string): void {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES_PREFIX + characterId);
  }

  // Settings
  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  // Security Lock
  static isLocked(): boolean {
    const settings = this.getSettings();
    if (!settings.security?.isLockEnabled || !settings.security?.pin) {
      return false;
    }
    return localStorage.getItem(STORAGE_KEYS.IS_LOCKED) === 'true';
  }

  static setLocked(locked: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_LOCKED, locked ? 'true' : 'false');
  }

  // Export full JSON Vault
  static exportVault(): string {
    const characters = this.getCharacters();
    const settings = this.getSettings();
    const allMessages: Record<string, ChatMessage[]> = {};

    for (const char of characters) {
      allMessages[char.id] = this.getMessages(char.id);
    }

    const payload = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      characters,
      settings,
      allMessages,
    };

    return JSON.stringify(payload, null, 2);
  }

  // Import JSON Vault
  static importVault(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.characters || !Array.isArray(data.characters)) {
        throw new Error('Invalid vault file structure');
      }

      this.saveCharacters(data.characters);

      if (data.settings) {
        this.saveSettings(data.settings);
      }

      if (data.allMessages && typeof data.allMessages === 'object') {
        for (const [charId, msgs] of Object.entries(data.allMessages)) {
          if (Array.isArray(msgs)) {
            this.saveMessages(charId, msgs as ChatMessage[]);
          }
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to import vault:', e);
      return false;
    }
  }
}

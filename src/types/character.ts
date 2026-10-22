export type Gender = 'female' | 'male' | 'nonbinary' | 'other';

export type MoodType = 
  | 'happy' 
  | 'flirty' 
  | 'shy' 
  | 'caring' 
  | 'melancholic' 
  | 'excited' 
  | 'pouting' 
  | 'thoughtful' 
  | 'serious' 
  | 'mysterious'
  | 'affectionate';

export interface Character {
  id: string;
  name: string;
  burmeseName: string;
  title: string;
  gender: Gender;
  age: number;
  avatar: string;
  coverImage?: string;
  relationship: string;
  personality: string;
  backstory: string;
  scenario: string;
  speakingStyle: string;
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  tags: string[];
  affinity: number; // 0 - 100
  currentMood: MoodType;
  greeting: string;
  isCustom?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserSecuritySettings {
  isLockEnabled: boolean;
  pin: string; // 4 or 6 digit PIN
  useBiometrics: boolean;
  autoLockMinutes: number; // 0 = immediate on blur/tab switch, 5 = 5 mins
  lastUnlockedAt?: number;
}

export interface AppSettings {
  language: 'my' | 'en';
  theme: 'dark' | 'light';
  themeAccent: 'rose' | 'amber' | 'emerald' | 'indigo' | 'violet';
  autoPlayVoice: boolean;
  speechEngine: 'gemini' | 'browser';
  voiceSpeed: number; // 0.8 to 1.2
  cloudSyncUrl?: string;
  lastCloudSync?: number;
  security: UserSecuritySettings;
}

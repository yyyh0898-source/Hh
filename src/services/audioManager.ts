import { requestSpeechSynthesis } from './apiClient.ts';

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentMessageId: string | null = null;
  private isSpeaking = false;
  private onStateChange: ((speaking: boolean, messageId: string | null) => void) | null = null;

  public setListener(callback: (speaking: boolean, messageId: string | null) => void) {
    this.onStateChange = callback;
  }

  private notify(speaking: boolean, messageId: string | null = null) {
    this.isSpeaking = speaking;
    this.currentMessageId = speaking ? messageId : null;
    if (this.onStateChange) {
      this.onStateChange(speaking, this.currentMessageId);
    }
  }

  public getSpeakingState() {
    return {
      isSpeaking: this.isSpeaking,
      messageId: this.currentMessageId,
    };
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notify(false, null);
  }

  /**
   * Play text with voice using Gemini TTS or Web Speech fallback
   */
  public async playText({
    messageId,
    text,
    voiceName = 'Kore',
    cachedAudioBase64,
    speechEngine = 'gemini',
    voiceSpeed = 1.0,
  }: {
    messageId: string;
    text: string;
    voiceName?: string;
    cachedAudioBase64?: string;
    speechEngine?: 'gemini' | 'browser';
    voiceSpeed?: number;
  }): Promise<string | null> {
    // If already playing this message, toggle stop
    if (this.isSpeaking && this.currentMessageId === messageId) {
      this.stop();
      return null;
    }

    this.stop();
    this.notify(true, messageId);

    // Filter out actions inside asterisks (e.g. *ပြုံးလျက်*) for natural speech
    const cleanText = text.replace(/\*[^*]*\*/g, '').trim() || text;

    try {
      // 1. If we have cached base64 audio or are using Gemini TTS
      let audioBase64 = cachedAudioBase64;

      if (!audioBase64 && speechEngine === 'gemini') {
        audioBase64 = (await requestSpeechSynthesis({ text: cleanText, voiceName })) || undefined;
      }

      if (audioBase64) {
        return await new Promise((resolve) => {
          const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
          audio.playbackRate = voiceSpeed;
          this.currentAudio = audio;

          audio.onended = () => {
            this.notify(false, null);
            resolve(audioBase64 || null);
          };

          audio.onerror = () => {
            this.fallbackBrowserSpeech(cleanText, voiceSpeed, resolve, audioBase64);
          };

          audio.play().catch(() => {
            this.fallbackBrowserSpeech(cleanText, voiceSpeed, resolve, audioBase64);
          });
        });
      } else {
        // Fallback to browser Web Speech API
        return await new Promise((resolve) => {
          this.fallbackBrowserSpeech(cleanText, voiceSpeed, resolve);
        });
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
      this.notify(false, null);
      return null;
    }
  }

  private fallbackBrowserSpeech(
    text: string,
    speed: number,
    resolve: (val: string | null) => void,
    returnedBase64?: string
  ) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.onend = () => {
        this.notify(false, null);
        resolve(returnedBase64 || null);
      };
      utterance.onerror = () => {
        this.notify(false, null);
        resolve(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      this.notify(false, null);
      resolve(null);
    }
  }
}

export const audioManager = new AudioManager();

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Heart, 
  Smile, 
  Eye, 
  EyeOff,
  Paperclip,
  X,
  Camera,
  CornerDownRight,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { Character, AppSettings, MoodType } from '../types/character.ts';
import { ChatMessage } from '../types/chat.ts';
import { translations } from '../utils/translations.ts';
import { sendChatMessage, requestSpeechSynthesis, requestImageGeneration } from '../services/apiClient.ts';
import { audioManager } from '../services/audioManager.ts';

interface ChatViewProps {
  character: Character;
  messages: ChatMessage[];
  settings: AppSettings;
  onUpdateCharacter: (char: Character) => void;
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onClearChat: () => void;
  onOpenMoodPicker: () => void;
  onOpenProfile: () => void;
  onOpenImageStudio: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  character,
  messages,
  settings,
  onUpdateCharacter,
  onUpdateMessages,
  onClearChat,
  onOpenMoodPicker,
  onOpenProfile,
  onOpenImageStudio,
}) => {
  const t = translations[settings.language];
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    dataUrl: string;
    mimeType: string;
    base64Data: string;
  } | null>(null);
  const [revealedThoughts, setRevealedThoughts] = useState<Record<string, boolean>>({});
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Audio state listener
  useEffect(() => {
    audioManager.setListener((speaking, messageId) => {
      setSpeakingMessageId(speaking ? messageId : null);
    });
    return () => {
      audioManager.stop();
    };
  }, []);

  // Handle send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if ((!text && !attachedImage) || isLoading) return;

    const userMessageId = 'user-' + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      characterId: character.id,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image: attachedImage ? attachedImage.dataUrl : undefined,
    };

    const currentImage = attachedImage;
    const updatedList = [...messages, newUserMessage];
    onUpdateMessages(updatedList);
    setInputText('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        character,
        messages: updatedList,
        currentMood: character.currentMood,
        userLanguage: settings.language,
        userImage: currentImage
          ? {
              mimeType: currentImage.mimeType,
              base64Data: currentImage.base64Data,
            }
          : undefined,
      });

      const aiMessageId = 'model-' + Date.now();
      const newAiMessage: ChatMessage = {
        id: aiMessageId,
        characterId: character.id,
        role: 'model',
        content: response.reply || '...',
        timestamp: Date.now(),
        detectedMood: response.detectedMood as MoodType,
        innerThought: response.innerThought,
        suggestedReplies: response.suggestedReplies,
      };

      const finalMessages = [...updatedList, newAiMessage];
      onUpdateMessages(finalMessages);

      // Update character emotional state and affinity
      const newAffinity = Math.min(
        100,
        Math.max(0, character.affinity + (response.affinityDelta || 1))
      );
      const newMood = (response.detectedMood as MoodType) || character.currentMood;

      onUpdateCharacter({
        ...character,
        affinity: newAffinity,
        currentMood: newMood,
        updatedAt: Date.now(),
      });

      // Auto play voice if enabled
      if (settings.autoPlayVoice) {
        handlePlayVoice(newAiMessage);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        characterId: character.id,
        role: 'model',
        content:
          settings.language === 'my'
            ? 'တောင်းပန်ပါတယ်ရှင့်... အင်တာနက် အနည်းငယ် နှေးနေသဖြင့် စကားပြောဆိုမှု မပြီးပြတ်သေးပါ။ ခဏနေ ပြန်လည်မေးမြန်းပေးပါနော်။'
            : 'I apologize, connection had a momentary hiccup. Please try again in a moment.',
        timestamp: Date.now(),
        isError: true,
      };
      onUpdateMessages([...updatedList, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Play or pause voice for a message
  const handlePlayVoice = async (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      audioManager.stop();
      return;
    }

    setIsSynthesizingVoice(true);
    try {
      const cachedAudio = await audioManager.playText({
        messageId: msg.id,
        text: msg.content,
        voiceName: character.voiceName || 'Kore',
        cachedAudioBase64: msg.audioBase64,
        speechEngine: settings.speechEngine,
        voiceSpeed: settings.voiceSpeed,
      });

      // Save audio cache to avoid re-synthesizing
      if (cachedAudio && !msg.audioBase64) {
        const updated = messages.map((m) =>
          m.id === msg.id ? { ...m, audioBase64: cachedAudio } : m
        );
        onUpdateMessages(updated);
      }
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  // Generate Photo Moment (AI creates and sends a scenic/character snapshot in chat)
  const handleGeneratePhotoMoment = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const prompt = `${character.name}, ${character.gender}, ${character.scenario}, emotional expression: ${character.currentMood}, cinematic portrait`;
    try {
      const imageUrl = await requestImageGeneration({
        prompt,
        style: 'cinematic',
      });

      const photoMessage: ChatMessage = {
        id: 'photo-' + Date.now(),
        characterId: character.id,
        role: 'model',
        content:
          settings.language === 'my'
            ? `*သင့်အတွက် ကျွန်မ/ကျွန်တော့်ရဲ့ ဒီအခိုက်အတန့် ဓာတ်ပုံလေးကို ပေးပို့လိုက်ပါတယ်* ✨`
            : `*I captured this moment for you to keep close to your heart* ✨`,
        timestamp: Date.now(),
        image:
          imageUrl ||
          'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
        detectedMood: character.currentMood,
        innerThought:
          settings.language === 'my'
            ? 'ငါ့ရဲ့ ပုံရိပ်လေးကို သူ သဘောကျပါ့မလားလို့ ရင်တမမ ဖြစ်နေမိတယ်...'
            : 'I wonder if they will smile seeing this picture...',
      };

      onUpdateMessages([...messages, photoMessage]);
    } catch (e) {
      console.error('Failed to generate photo moment:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Image Upload from User
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';
      setAttachedImage({
        dataUrl: result,
        mimeType: file.type,
        base64Data,
      });
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleInnerThought = (messageId: string) => {
    setRevealedThoughts((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  // Format asterisk text (actions) gracefully
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span
            key={index}
            className="italic text-rose-300/90 font-light block my-1 px-2.5 py-1 rounded bg-rose-500/10 border-l-2 border-rose-500/50 text-xs sm:text-sm"
          >
            {part.slice(1, -1)}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const displayName =
    settings.language === 'my' && character.burmeseName
      ? character.burmeseName
      : character.name;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/95 overflow-hidden relative">
      {/* Top Scenario Banner */}
      <div className="px-4 py-2 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-rose-400 shrink-0">{displayName}</span>
          <span className="text-slate-500">•</span>
          <span className="truncate text-slate-400 italic">"{character.scenario}"</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGeneratePhotoMoment}
            title={t.generatePhoto}
            className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1 transition text-[11px]"
          >
            <Camera className="w-3 h-3" />
            <span className="hidden sm:inline">{t.generatePhoto}</span>
          </button>

          <button
            onClick={onClearChat}
            title={t.clearChat}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeaking = speakingMessageId === msg.id;
          const isThoughtRevealed = revealedThoughts[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div className="flex items-end gap-2 max-w-[92%] sm:max-w-[85%]">
                {/* Character Avatar */}
                {!isUser && (
                  <img
                    src={character.avatar}
                    alt={character.name}
                    onClick={onOpenProfile}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-rose-500/40 shrink-0 cursor-pointer hover:scale-105 transition mb-1"
                  />
                )}

                {/* Speech Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-md relative transition-all ${
                    isUser
                      ? 'bg-gradient-to-tr from-rose-600 to-rose-700 text-white rounded-br-xs'
                      : 'bg-slate-900 border border-slate-800/90 text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Photo attachment if present */}
                  {msg.image && (
                    <div className="mb-2.5 overflow-hidden rounded-xl border border-slate-700/80 shadow-md">
                      <img
                        src={msg.image}
                        alt="Photo attachment"
                        className="max-h-64 sm:max-h-80 w-full object-cover hover:scale-102 transition duration-300"
                      />
                    </div>
                  )}

                  {/* Message Text with Asterisk Formatting */}
                  <div className="text-sm sm:text-base leading-relaxed break-words">
                    {renderFormattedContent(msg.content)}
                  </div>

                  {/* Character Inner Thought Reveal */}
                  {!isUser && msg.innerThought && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => toggleInnerThought(msg.id)}
                        className="text-[11px] text-indigo-300/90 hover:text-indigo-200 flex items-center gap-1 transition"
                      >
                        {isThoughtRevealed ? (
                          <EyeOff className="w-3 h-3 text-indigo-400" />
                        ) : (
                          <Eye className="w-3 h-3 text-indigo-400" />
                        )}
                        <span>{t.innerThought}</span>
                      </button>

                      {isThoughtRevealed && (
                        <div className="mt-1.5 p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 text-xs italic animate-fadeIn">
                          💭 "{msg.innerThought}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Footer: Voice button, Mood icon, Timestamp */}
                  <div
                    className={`flex items-center justify-between gap-3 mt-2 text-[10px] ${
                      isUser ? 'text-rose-200/80' : 'text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!isUser && (
                        <button
                          onClick={() => handlePlayVoice(msg)}
                          disabled={isSynthesizingVoice}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition font-medium ${
                            isSpeaking
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3 h-3" />
                              <span>{t.stopVoice}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-rose-400" />
                              <span>{t.listenVoice}</span>
                            </>
                          )}
                        </button>
                      )}

                      {!isUser && msg.detectedMood && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-300/90 text-[10px]">
                          {t.moods[msg.detectedMood] || msg.detectedMood}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-70">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isUser && <CheckCheck className="w-3 h-3 text-rose-200" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested quick replies for the latest AI message */}
              {!isUser &&
                msg.suggestedReplies &&
                msg.id === messages[messages.length - 1]?.id &&
                !isLoading && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-10">
                    {msg.suggestedReplies.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(reply)}
                        className="text-xs px-3 py-1 rounded-full bg-slate-900/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition shadow-xs flex items-center gap-1 group"
                      >
                        <CornerDownRight className="w-3 h-3 text-rose-400 group-hover:translate-x-0.5 transition" />
                        <span>{reply}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2 max-w-[80%]">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-rose-500/40 shrink-0"
            />
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2 shadow-md">
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              <span>{displayName} {t.generating}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Photo Attachment Preview Bar */}
      {attachedImage && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={attachedImage.dataUrl}
              alt="Attached preview"
              className="w-12 h-12 rounded-lg object-cover border border-rose-500/50"
            />
            <div>
              <p className="text-xs font-medium text-slate-200">
                {settings.language === 'my' ? 'ဓာတ်ပုံတွဲထားသည်' : 'Photo Attached'}
              </p>
              <p className="text-[10px] text-slate-400">
                {settings.language === 'my'
                  ? 'AI ဇာတ်ကောင်မှ ဤပုံကို ကြည့်ရှုတုံ့ပြန်ပါမည်'
                  : 'Character will emotionally react to this photo'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAttachedImage(null)}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 sm:p-4 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Photo attach button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={t.sendPhoto}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-rose-400 border border-slate-700/60 transition shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text input area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`${displayName} သို့ ${t.typeMessage}`}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none max-h-32 transition"
            />
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!inputText.trim() && !attachedImage) || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white shadow-md shadow-rose-950/40 transition shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Camera, 
  Download, 
  Send, 
  RefreshCw, 
  Image as ImageIcon,
  Check,
  Palette
} from 'lucide-react';
import { Character, AppSettings } from '../types/character.ts';
import { translations } from '../utils/translations.ts';
import { requestImageGeneration } from '../services/apiClient.ts';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  character: Character | null;
  settings: AppSettings;
  onClose: () => void;
  onSetAsAvatar: (url: string) => void;
  onSendToChat?: (imageUrl: string, promptText: string) => void;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  character,
  settings,
  onClose,
  onSetAsAvatar,
  onSendToChat,
}) => {
  if (!isOpen) return null;

  const t = translations[settings.language];
  const [prompt, setPrompt] = useState(
    character
      ? `${character.name}, ${character.title}, standing in a soft sunlit garden, warm gentle smile`
      : 'Beautiful romantic aesthetic portrait, warm lighting, cinematic'
  );
  const [style, setStyle] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const presetIdeas = [
    settings.language === 'my'
      ? 'မိုးရွာနေစဉ် ထီးလေးဆောင်းပြီး ချစ်ရသူကို ပြုံးကြည့်နေသော ညနေခင်း'
      : 'Walking in a gentle rain with an umbrella, smiling softly at you',
    settings.language === 'my'
      ? 'ဆည်းဆာနေရောင်အောက် ရွှေရောင်လွှမ်းနေသော ကော်ဖီဆိုင် ဝရန်တာ'
      : 'Golden hour sunset at a vintage wooden cafe terrace',
    settings.language === 'my'
      ? 'ကြယ်တွေပြည့်နေသော ညကောင်းကင်အောက် အတူထိုင်ငေးနေသည့် အခိုက်အတန့်'
      : 'Stargazing together under a crystal clear midnight sky',
    settings.language === 'my'
      ? 'ရှေးခေတ်ပုဂံနန်းတော် ရှေ့မျက်နှာစာ၌ ရိုမန့်တစ်ဆန်သော မြင်ကွင်း'
      : 'Ancient golden palace terrace with misty panoramic view',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const url = await requestImageGeneration({
        prompt: prompt.trim(),
        style,
      });

      if (url) {
        setGeneratedImage(url);
      } else {
        // High aesthetic fallback photo
        setGeneratedImage('https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `character-moment-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm sm:text-base">
                {t.imageStudio}
              </h2>
              <p className="text-xs text-slate-400">
                {settings.language === 'my'
                  ? 'ဇာတ်ကောင်နှင့် ပုံရိပ်အခိုက်အတန့်များကို ဖန်တီးပါ'
                  : 'Generate visual moments and character portraits'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              {settings.language === 'my' ? 'ပုံဖော်လိုသော အကြောင်းအရာ (Prompt)' : 'Image Prompt'}
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.imagePromptPlaceholder}
              className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none"
            />
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">
              {settings.language === 'my' ? 'စိတ်ကူး အကြံပြုချက်များ:' : 'Quick Ideas:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presetIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border border-slate-800 transition"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              {t.imageStyle}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cinematic', label: t.styles.cinematic },
                { id: 'anime', label: t.styles.anime },
                { id: 'fantasy', label: t.styles.fantasy },
                { id: 'watercolor', label: t.styles.watercolor },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition ${
                    style === s.id
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.generating}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.generateImageBtn}</span>
              </>
            )}
          </button>

          {/* Generated Result Preview */}
          {generatedImage && (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="overflow-hidden rounded-xl border border-slate-700">
                <img
                  src={generatedImage}
                  alt="Generated visual"
                  className="w-full max-h-72 object-cover"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetAsAvatar(generatedImage)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{settings.language === 'my' ? 'Avatar အဖြစ် သတ်မှတ်မည်' : 'Set as Avatar'}</span>
                </button>

                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onSendToChat(generatedImage, prompt);
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{settings.language === 'my' ? 'စကားပြောခန်းသို့ ပို့မည်' : 'Send to Chat'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownload}
                  title="Download Image"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

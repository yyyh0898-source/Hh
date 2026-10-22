import React from 'react';
import { X, Sparkles, Heart } from 'lucide-react';
import { Character, MoodType, AppSettings } from '../types/character.ts';
import { translations } from '../utils/translations.ts';

interface MoodPickerModalProps {
  isOpen: boolean;
  character: Character;
  settings: AppSettings;
  onClose: () => void;
  onSelectMood: (mood: MoodType) => void;
}

export const MoodPickerModal: React.FC<MoodPickerModalProps> = ({
  isOpen,
  character,
  settings,
  onClose,
  onSelectMood,
}) => {
  if (!isOpen) return null;

  const t = translations[settings.language];

  const moodList: { id: MoodType; emoji: string; desc: string }[] = [
    { id: 'caring', emoji: '🥰', desc: settings.language === 'my' ? 'နွေးထွေးဂရုစိုက်ပြီး အားပေးလိုစိတ်' : 'Warm, protective and nurturing' },
    { id: 'flirty', emoji: '😉', desc: settings.language === 'my' ? 'စနောက်ကျီစယ်ပြီး ရိုမန့်တစ်ဆန်သော အကြည့်' : 'Playful teasing and romantic sparks' },
    { id: 'shy', emoji: '😳', desc: settings.language === 'my' ? 'ရှက်သွေးဖြာကာ စကားမပြောရဲဖြစ်နေသည်' : 'Blushing, timid and flustered' },
    { id: 'affectionate', emoji: '💖', desc: settings.language === 'my' ? 'ချစ်ခင်မြတ်နိုးမှု အပြည့်ဖြင့် နီးကပ်လိုသည်' : 'Deeply devoted and fond of you' },
    { id: 'happy', emoji: '😊', desc: settings.language === 'my' ? 'စိတ်ရွှင်လန်းတက်ကြွပြီး ပျော်ရွှင်နေသည်' : 'Cheerful and uplifting energy' },
    { id: 'excited', emoji: '🤩', desc: settings.language === 'my' ? 'အလွန်စိတ်လှုပ်ရှားပြီး အားတက်နေသည်' : 'Thrilled with vibrant passion' },
    { id: 'thoughtful', emoji: '🤔', desc: settings.language === 'my' ? 'နက်နက်ရှိုင်းရှိုင်း တွေးတောဆင်ခြင်နေသည်' : 'Deep contemplation and curiosity' },
    { id: 'pouting', emoji: '😤', desc: settings.language === 'my' ? 'ကောက်စိတ်ကောက်ပြီး ချော့ချင်စဖွယ်ပုံစံ' : 'Pouting cutely, wants your attention' },
    { id: 'melancholic', emoji: '🥺', desc: settings.language === 'my' ? 'ဆွေးမြေ့ငြိမ်သက်ပြီး နှစ်သိမ့်မှုလိုနေသည်' : 'Soft sadness, seeking gentle comfort' },
    { id: 'serious', emoji: '🧐', desc: settings.language === 'my' ? 'တည်ကြည်ခန့်ညားသော အမူအရာ' : 'Composed, disciplined and formal' },
    { id: 'mysterious', emoji: '🤫', desc: settings.language === 'my' ? 'လျှို့ဝှက်ဆန်းကြယ်ပြီး ဆွဲဆောင်မှုရှိသည်' : 'Enigmatic whispers and quiet allure' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {t.changeMood}
              </h3>
              <p className="text-xs text-slate-400">
                {character.burmeseName || character.name}
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

        {/* Mood Grid */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-2">
          {moodList.map((m) => {
            const isSelected = character.currentMood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  onSelectMood(m.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between border transition text-left group ${
                  isSelected
                    ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                    : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition">{m.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-rose-300 transition">
                      {t.moods[m.id]}
                    </p>
                    <p className="text-[11px] text-slate-400">{m.desc}</p>
                  </div>
                </div>

                {isSelected && (
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

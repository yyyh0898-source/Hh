import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Save, 
  Wand2, 
  Camera, 
  RefreshCw, 
  User, 
  Heart, 
  BookOpen, 
  MessageSquare,
  Volume2
} from 'lucide-react';
import { Character, Gender, AppSettings } from '../types/character.ts';
import { translations } from '../utils/translations.ts';
import { requestCharacterGeneration, requestImageGeneration } from '../services/apiClient.ts';

interface CharacterCreatorModalProps {
  isOpen: boolean;
  initialMode?: 'ai' | 'manual';
  settings: AppSettings;
  onClose: () => void;
  onSaveCharacter: (character: Character) => void;
}

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  isOpen,
  initialMode = 'ai',
  settings,
  onClose,
  onSaveCharacter,
}) => {
  if (!isOpen) return null;

  const t = translations[settings.language];
  const [mode, setMode] = useState<'ai' | 'manual'>(initialMode);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  // AI Prompt Form
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGender, setAiGender] = useState<Gender>('female');
  const [aiRelationship, setAiRelationship] = useState('Childhood Friend');

  // Character Data Form
  const [name, setName] = useState('');
  const [burmeseName, setBurmeseName] = useState('');
  const [title, setTitle] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState<number>(22);
  const [relationship, setRelationship] = useState('Friend');
  const [personality, setPersonality] = useState('');
  const [backstory, setBackstory] = useState('');
  const [scenario, setScenario] = useState('');
  const [speakingStyle, setSpeakingStyle] = useState('');
  const [greeting, setGreeting] = useState('');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80');
  const [voiceName, setVoiceName] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');

  // Handle AI Auto-Generation
  const handleAiGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const generated = await requestCharacterGeneration({
        prompt: aiPrompt || 'A warm and deeply affectionate companion',
        gender: aiGender,
        relationship: aiRelationship,
        language: settings.language,
      });

      setName(generated.name || 'Aria');
      setBurmeseName(generated.burmeseName || 'လင်းလက်');
      setTitle(generated.relationship || 'ချစ်ရသူ');
      setGender(aiGender);
      setAge(generated.age || 22);
      setRelationship(generated.relationship || aiRelationship);
      setPersonality(generated.personality || '');
      setBackstory(generated.backstory || '');
      setScenario(generated.scenario || '');
      setSpeakingStyle(generated.speakingStyle || '');
      setGreeting(generated.greeting || '');

      if (generated.suggestedVoice?.includes('Charon')) setVoiceName('Charon');
      else if (generated.suggestedVoice?.includes('Fenrir')) setVoiceName('Fenrir');
      else if (generated.suggestedVoice?.includes('Puck')) setVoiceName('Puck');
      else if (generated.suggestedVoice?.includes('Zephyr')) setVoiceName('Zephyr');
      else setVoiceName('Kore');

      // Switch to manual view for user review & tweaking
      setMode('manual');
    } catch (e: any) {
      alert(e?.message || 'Failed to generate character');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate AI Avatar
  const handleGenerateAvatar = async () => {
    if (isGeneratingAvatar) return;
    setIsGeneratingAvatar(true);
    try {
      const prompt = `${name}, ${burmeseName}, ${gender}, age ${age}, ${personality.slice(0, 80)}, portrait, highly detailed`;
      const url = await requestImageGeneration({ prompt, style: 'cinematic' });
      if (url) {
        setAvatar(url);
      }
    } catch (e) {
      console.warn('Avatar gen fallback', e);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // Save Character
  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter character name');
      return;
    }

    const newChar: Character = {
      id: 'custom-' + Date.now(),
      name: name.trim(),
      burmeseName: burmeseName.trim() || name.trim(),
      title: title.trim() || relationship,
      gender,
      age: Number(age) || 20,
      avatar,
      relationship,
      personality: personality.trim() || 'နွေးထွေးပြီး အားကိုးရသည်',
      backstory: backstory.trim() || 'သင့်အတွက် အမြဲအနားရှိနေပေးသော သစ္စာရှိအဖော်မွန်',
      scenario: scenario.trim() || 'ဆိတ်ငြိမ်သော ညနေခင်းတစ်ခုတွင် နှစ်ယောက်တည်း စကားပြောနေကြသည်။',
      speakingStyle: speakingStyle.trim() || 'နူးညံ့ညင်သာသော အသံဖြင့် စကားပြောသည်',
      voiceName,
      tags: ['Custom', relationship],
      affinity: 20,
      currentMood: 'caring',
      greeting: greeting.trim() || `*ပြုံးပြုံးလေးကြည့်ရင်း* "မင်္ဂလာပါ... မင်းနဲ့ စကားပြောခွင့်ရတာ ဝမ်းသာပါတယ်နော်"`,
      isCustom: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveCharacter(newChar);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm sm:text-base">
                {t.newCharacter}
              </h2>
              <p className="text-xs text-slate-400">
                {settings.language === 'my'
                  ? 'သင်နှစ်သက်ရာ ဇာတ်ကောင်နှင့် ဇာတ်လမ်းကို စိတ်ကြိုက်ဖန်တီးပါ'
                  : 'Design your own custom companion and story'}
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

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              mode === 'ai'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{t.aiCreate}</span>
          </button>

          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
              mode === 'manual'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.manualCreate}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[72vh] overflow-y-auto space-y-4">
          {mode === 'ai' ? (
            /* AI Quick Generator */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  {settings.language === 'my'
                    ? 'ဇာတ်ကောင် စိတ်ကူး (Idea Prompt)'
                    : 'Describe your character concept'}
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={
                    settings.language === 'my'
                      ? 'ဥပမာ - ရန်ကုန်မြို့ပြက အေးဆေးတည်ငြိမ်တဲ့ ကော်ဖီဆိုင်ပိုင်ရှင်၊ သို့မဟုတ် ရှေးပုဂံခေတ်က ကိုယ်ရံတော် မင်းသား၊ သို့မဟုတ် စနောက်တတ်တဲ့ ငယ်သူငယ်ချင်း ကောင်မလေး...'
                      : 'e.g. A tsundere barista who remembers your order, or a noble royal guard from an ancient dynasty...'
                  }
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t.gender}</label>
                    <select
                      value={aiGender}
                      onChange={(e) => setAiGender(e.target.value as Gender)}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                    >
                      <option value="female">{t.female}</option>
                      <option value="male">{t.male}</option>
                      <option value="nonbinary">{t.nonbinary}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t.relationship}</label>
                    <input
                      type="text"
                      value={aiRelationship}
                      onChange={(e) => setAiRelationship(e.target.value)}
                      placeholder="Childhood Friend, CEO, Mentor..."
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/30 transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.generating}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{settings.language === 'my' ? 'AI ဖြင့် အပြည့်အစုံ ဖန်တီးမည်' : 'Generate Full Persona'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Manual Detailed Studio */
            <div className="space-y-4">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-rose-500/50 shadow-md"
                />
                <div className="flex-1 space-y-1.5">
                  <label className="block text-xs text-slate-300 font-medium">Avatar Image URL</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    disabled={isGeneratingAvatar}
                    className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs flex items-center gap-1 border border-rose-500/30 transition"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{isGeneratingAvatar ? t.generating : t.generatePhoto}</span>
                  </button>
                </div>
              </div>

              {/* Names & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.name} (English)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Min Thant"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.burmeseName} (မြန်မာအမည်)</label>
                  <input
                    type="text"
                    value={burmeseName}
                    onChange={(e) => setBurmeseName(e.target.value)}
                    placeholder="e.g. မင်းသန့်"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Age, Gender, Voice */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.gender}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="female">{t.female}</option>
                    <option value="male">{t.male}</option>
                    <option value="nonbinary">{t.nonbinary}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.age}</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.voiceName}</label>
                  <select
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="Kore">Kore (Warm Female)</option>
                    <option value="Charon">Charon (Deep Male)</option>
                    <option value="Puck">Puck (Playful)</option>
                    <option value="Fenrir">Fenrir (Noble Male)</option>
                    <option value="Zephyr">Zephyr (Soft Gentle)</option>
                  </select>
                </div>
              </div>

              {/* Relationship & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.relationship}</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Childhood Friend, Partner..."
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Title / Tagline</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. စီးပွားရေးလုပ်ငန်းရှင်"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Personality */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t.personality}</label>
                <textarea
                  rows={2}
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="စရိုက်လက္ခဏာများ..."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              {/* Backstory */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t.backstory}</label>
                <textarea
                  rows={2}
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="နောက်ခံဇာတ်လမ်း..."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              {/* Scenario */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t.scenario}</label>
                <input
                  type="text"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="တွေ့ဆုံသည့် အခိုက်အတန့်..."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              {/* Speaking Style */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t.speakingStyle}</label>
                <input
                  type="text"
                  value={speakingStyle}
                  onChange={(e) => setSpeakingStyle(e.target.value)}
                  placeholder="စကားပြောဟန် (နော်၊ ရှင့်၊ ဗျာ)..."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>

              {/* First Greeting */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t.greeting}</label>
                <textarea
                  rows={2}
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="ပထမဆုံး နှုတ်ဆက်စကား (*ပြုံးလျက်* မင်္ဂလာပါ)..."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            {t.cancel}
          </button>

          {mode === 'manual' && (
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/30 transition"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveCharacter}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

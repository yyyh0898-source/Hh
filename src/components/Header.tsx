import React from 'react';
import { 
  Sparkles, 
  Lock, 
  Globe, 
  Moon, 
  Sun, 
  Settings, 
  Menu, 
  Heart, 
  Smile, 
  Camera, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Character, AppSettings, MoodType } from '../types/character.ts';
import { translations, Language } from '../utils/translations.ts';

interface HeaderProps {
  activeCharacter: Character | null;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenMoodPicker: () => void;
  onOpenImageStudio: () => void;
  onToggleSidebar: () => void;
  onLockApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCharacter,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenProfile,
  onOpenMoodPicker,
  onOpenImageStudio,
  onToggleSidebar,
  onLockApp,
}) => {
  const t = translations[settings.language];

  const moodEmojis: Record<MoodType, string> = {
    happy: '😊',
    flirty: '😉',
    shy: '😳',
    caring: '🥰',
    melancholic: '🥺',
    excited: '🤩',
    pouting: '😤',
    thoughtful: '🤔',
    serious: '🧐',
    mysterious: '🤫',
    affectionate: '💖',
  };

  const toggleLanguage = () => {
    const nextLang: Language = settings.language === 'my' ? 'en' : 'my';
    onUpdateSettings({ ...settings, language: nextLang });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  return (
    <header className="h-16 px-3 sm:px-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Toggle & Brand / Active Character */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 md:hidden transition"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {activeCharacter ? (
          <div 
            onClick={onOpenProfile}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition"
          >
            <div className="relative">
              <img
                src={activeCharacter.avatar}
                alt={activeCharacter.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/50 shadow-md group-hover:scale-105 transition"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-sm sm:text-base group-hover:text-rose-400 transition">
                  {settings.language === 'my' && activeCharacter.burmeseName
                    ? activeCharacter.burmeseName
                    : activeCharacter.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 hidden sm:inline-block">
                  {activeCharacter.title}
                </span>
              </div>

              {/* Affinity Meter & Mood */}
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center text-rose-400 text-xs gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span className="font-mono text-[11px]">{activeCharacter.affinity}%</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMoodPicker();
                  }}
                  className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-slate-800/90 text-amber-300 hover:bg-slate-700 border border-slate-700 transition"
                >
                  <span>{moodEmojis[activeCharacter.currentMood] || '✨'}</span>
                  <span className="hidden xs:inline">
                    {t.moods[activeCharacter.currentMood] || activeCharacter.currentMood}
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base leading-tight">
                {t.appName}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.appTagline}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Photo Studio shortcut */}
        <button
          onClick={onOpenImageStudio}
          title={t.imageStudio}
          className="p-2 rounded-xl bg-slate-800/70 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-slate-700/60 transition flex items-center gap-1.5 text-xs font-medium"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden md:inline">{t.imageStudio}</span>
        </button>

        {/* Language switch */}
        <button
          onClick={toggleLanguage}
          title="Switch Language (မြန်မာ / English)"
          className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition flex items-center gap-1 text-xs font-medium"
        >
          <Globe className="w-4 h-4 text-indigo-400" />
          <span>{settings.language === 'my' ? 'MY' : 'EN'}</span>
        </button>

        {/* Theme switch */}
        <button
          onClick={toggleTheme}
          title={settings.theme === 'dark' ? t.light : t.dark}
          className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-300" />
          )}
        </button>

        {/* Lock App */}
        {settings.security?.isLockEnabled && (
          <button
            onClick={onLockApp}
            title={t.lockApp}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title={t.settings}
          className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

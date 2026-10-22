import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  UserCheck, 
  Database, 
  CloudCheck, 
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Heart
} from 'lucide-react';
import { Character, AppSettings, Gender } from '../types/character.ts';
import { translations } from '../utils/translations.ts';

interface SidebarProps {
  characters: Character[];
  activeCharacterId: string;
  settings: AppSettings;
  isOpen: boolean;
  onSelectCharacter: (id: string) => void;
  onOpenCreator: (mode: 'ai' | 'manual') => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  characters,
  activeCharacterId,
  settings,
  isOpen,
  onSelectCharacter,
  onOpenCreator,
  onCloseMobile,
}) => {
  const t = translations[settings.language];
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | Gender | 'custom'>('all');

  const filteredCharacters = characters.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.burmeseName?.includes(searchTerm) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.personality.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (genderFilter === 'all') return true;
    if (genderFilter === 'custom') return !!c.isCustom;
    return c.gender === genderFilter;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & New Character Actions */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              {t.characters}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {characters.length}
            </span>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenCreator('ai');
                onCloseMobile();
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/30 transition hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.aiCreate}</span>
            </button>

            <button
              onClick={() => {
                onOpenCreator('manual');
                onCloseMobile();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.manualCreate}</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchCharacters}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {[
              { id: 'all', label: settings.language === 'my' ? 'အားလုံး' : 'All' },
              { id: 'female', label: t.female },
              { id: 'male', label: t.male },
              { id: 'custom', label: settings.language === 'my' ? 'ကိုယ်ပိုင်' : 'Custom' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGenderFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 font-medium ${
                  genderFilter === tab.id
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredCharacters.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <UserCheck className="w-8 h-8 mx-auto opacity-30 text-rose-400" />
              <p>{settings.language === 'my' ? 'ဇာတ်ကောင် မတွေ့ရှိပါ' : 'No characters found'}</p>
            </div>
          ) : (
            filteredCharacters.map((char) => {
              const isActive = char.id === activeCharacterId;
              const displayName =
                settings.language === 'my' && char.burmeseName
                  ? char.burmeseName
                  : char.name;

              return (
                <div
                  key={char.id}
                  onClick={() => {
                    onSelectCharacter(char.id);
                    onCloseMobile();
                  }}
                  className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition border relative group ${
                    isActive
                      ? 'bg-slate-800/90 border-rose-500/50 shadow-md shadow-rose-950/20'
                      : 'bg-slate-900/50 hover:bg-slate-800/60 border-transparent hover:border-slate-800'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-700 group-hover:ring-rose-500/60 transition"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                  </div>

                  {/* Character Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-200 text-sm truncate group-hover:text-rose-300 transition">
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-rose-400 shrink-0">
                        <Heart className="w-2.5 h-2.5 fill-rose-500" />
                        <span>{char.affinity}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {char.title}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/80 text-amber-300/90 border border-slate-800">
                        {t.moods[char.currentMood] || char.currentMood}
                      </span>
                      {char.isCustom && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {settings.language === 'my' ? 'ကိုယ်ပိုင်' : 'Custom'}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-slate-600 transition shrink-0 ${
                    isActive ? 'text-rose-400' : 'group-hover:text-slate-400'
                  }`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Offline & Cloud Vault status */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400/90 font-medium">{t.offline}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-indigo-400">
            <Shield className="w-3.5 h-3.5" />
            <span>{settings.language === 'my' ? 'သီးသန့် လုံခြုံမှုရှိ' : 'Private Vault'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

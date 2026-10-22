import React from 'react';
import { 
  X, 
  Heart, 
  Trash2, 
  Edit3, 
  Volume2, 
  Sparkles, 
  User, 
  Calendar, 
  BookOpen, 
  Compass, 
  MessageSquareQuote 
} from 'lucide-react';
import { Character, AppSettings } from '../types/character.ts';
import { translations } from '../utils/translations.ts';

interface CharacterProfileModalProps {
  isOpen: boolean;
  character: Character | null;
  settings: AppSettings;
  onClose: () => void;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
}

export const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({
  isOpen,
  character,
  settings,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !character) return null;

  const t = translations[settings.language];
  const displayName =
    settings.language === 'my' && character.burmeseName
      ? character.burmeseName
      : character.name;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto animate-scaleUp">
        {/* Cover Photo */}
        <div className="h-36 sm:h-44 relative bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950">
          {character.coverImage ? (
            <img
              src={character.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
              <Sparkles className="w-12 h-12 opacity-30" />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar & Main Info */}
        <div className="px-5 sm:px-6 relative pb-6 -mt-16 sm:-mt-18 space-y-4">
          <div className="flex items-end justify-between">
            <div className="relative">
              <img
                src={character.avatar}
                alt={character.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-slate-900 shadow-xl"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-slate-900"></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onEdit(character);
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 text-xs font-medium"
              >
                <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.editProfile}</span>
              </button>

              {character.isCustom && (
                <button
                  onClick={() => {
                    if (confirm(t.deleteConfirm)) {
                      onDelete(character.id);
                      onClose();
                    }
                  }}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                  title={t.deleteCharacter}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                {displayName}
              </h2>
              {character.name !== displayName && (
                <span className="text-sm text-slate-400">({character.name})</span>
              )}
            </div>
            <p className="text-rose-400 text-xs sm:text-sm font-medium mt-0.5">
              {character.title}
            </p>
          </div>

          {/* Affinity & Bond Meter */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {t.affinityMeter}
              </span>
              <span className="font-mono text-rose-300 font-bold">{character.affinity}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, character.affinity))}%` }}
              />
            </div>
          </div>

          {/* Metadata badges: Age, Gender, Voice */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{t.age}</p>
              <p className="text-slate-200 font-medium mt-0.5">{character.age} Years</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{t.gender}</p>
              <p className="text-slate-200 font-medium mt-0.5 capitalize">{character.gender}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{t.voiceName}</p>
              <p className="text-rose-300 font-medium mt-0.5">{character.voiceName || 'Kore'}</p>
            </div>
          </div>

          {/* Lore & Details */}
          <div className="space-y-3 pt-2 text-xs text-slate-300 max-h-52 overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs text-rose-400">
                <BookOpen className="w-3.5 h-3.5" />
                {t.personality}
              </p>
              <p className="text-slate-300 leading-relaxed">{character.personality}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs text-indigo-400">
                <Compass className="w-3.5 h-3.5" />
                {t.backstory}
              </p>
              <p className="text-slate-300 leading-relaxed">{character.backstory}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs text-amber-400">
                <MessageSquareQuote className="w-3.5 h-3.5" />
                {t.scenario}
              </p>
              <p className="text-slate-300 leading-relaxed italic">{character.scenario}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

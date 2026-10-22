import React, { useState, useRef } from 'react';
import { 
  X, 
  Globe, 
  Moon, 
  Sun, 
  Palette, 
  Lock, 
  ShieldCheck, 
  Fingerprint, 
  Cloud, 
  Download, 
  Upload, 
  Volume2, 
  Check, 
  Sparkles,
  RefreshCw,
  Database
} from 'lucide-react';
import { AppSettings, UserSecuritySettings } from '../types/character.ts';
import { translations, Language } from '../utils/translations.ts';
import { StorageService } from '../services/storage.ts';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onTriggerSetupPin: () => void;
  onVaultRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onTriggerSetupPin,
  onVaultRestored,
}) => {
  if (!isOpen) return null;

  const t = translations[settings.language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Export JSON Vault
  const handleExport = () => {
    const json = StorageService.exportVault();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `character-ai-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Vault
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importVault(content);
        if (success) {
          alert(settings.language === 'my' ? 'ဒေတာများ အောင်မြင်စွာ ပြန်လည်သွင်းယူပြီးပါပြီ!' : 'Vault restored successfully!');
          onVaultRestored();
          onClose();
        } else {
          alert('Failed to parse vault file');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Instant Cloud Sync Simulation
  const handleCloudSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      onUpdateSettings({
        ...settings,
        lastCloudSync: Date.now(),
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(null), 3000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl my-auto animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-100 text-base sm:text-lg">
              {t.settings}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings List */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Language & Appearance */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{t.language} & {t.theme}</span>
            </h3>

            {/* Language toggle */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">{t.language}</p>
                <p className="text-xs text-slate-400">မြန်မာဘာသာ / English</p>
              </div>

              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'my' })}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    settings.language === 'my'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  မြန်မာ
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    settings.language === 'en'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Dark / Light Mode */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">{t.theme}</p>
                <p className="text-xs text-slate-400">
                  {settings.theme === 'dark' ? t.dark : t.light}
                </p>
              </div>

              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    settings.theme === 'dark'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{t.dark}</span>
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                  className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
                    settings.theme === 'light'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{t.light}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Security & Lock (Face ID / Fingerprint / PIN) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.securityTitle}</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              {/* Enable Lock Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.enableLock}</p>
                  <p className="text-xs text-slate-400">{t.securityDesc}</p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.security.isLockEnabled}
                  onChange={(e) => {
                    const isEnabled = e.target.checked;
                    if (isEnabled && !settings.security.pin) {
                      onTriggerSetupPin();
                    } else {
                      onUpdateSettings({
                        ...settings,
                        security: { ...settings.security, isLockEnabled: isEnabled },
                      });
                    }
                  }}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              {settings.security.isLockEnabled && (
                <>
                  {/* Change PIN button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        {settings.language === 'my' ? 'လျှို့ဝှက်ကုဒ် PIN ကုဒ်' : 'PIN Passcode'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {settings.security.pin ? '•••• (PIN သတ်မှတ်ထားပြီး)' : 'PIN မသတ်မှတ်ရသေးပါ'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onTriggerSetupPin}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                    >
                      {settings.security.pin
                        ? (settings.language === 'my' ? 'PIN ပြောင်းမည်' : 'Change PIN')
                        : t.setupPin}
                    </button>
                  </div>

                  {/* Face ID / Fingerprint Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-rose-400" />
                      <div>
                        <p className="text-xs font-medium text-slate-300">{t.useBiometrics}</p>
                        <p className="text-[11px] text-slate-500">
                          {settings.language === 'my'
                            ? 'Face ID သို့မဟုတ် Fingerprint ဖြင့် အမြန်ဖွင့်ရန်'
                            : 'Quick unlock using biometric authenticator'}
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={settings.security.useBiometrics}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            useBiometrics: e.target.checked,
                          },
                        });
                      }}
                      className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Auto-lock timer */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-xs text-slate-400 mb-1.5">
                      {t.autoLockTimer}
                    </label>
                    <select
                      value={settings.security.autoLockMinutes}
                      onChange={(e) => {
                        onUpdateSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            autoLockMinutes: Number(e.target.value),
                          },
                        });
                      }}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                    >
                      <option value={0}>{t.immediate}</option>
                      <option value={1}>{t.oneMinute}</option>
                      <option value={5}>{t.fiveMinutes}</option>
                      <option value={15}>{t.fifteenMinutes}</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. Voice Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{t.voiceSettings}</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{t.autoPlayVoice}</p>
                  <p className="text-xs text-slate-400">
                    {settings.language === 'my'
                      ? 'AI စကားပြောတိုင်း အသံထွက် ဖွင့်ပေးမည်'
                      : 'Play voice audio automatically on new replies'}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={settings.autoPlayVoice}
                  onChange={(e) => {
                    onUpdateSettings({
                      ...settings,
                      autoPlayVoice: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                />
              </div>

              {/* Speech Engine */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs text-slate-400 mb-1">{t.speechEngine}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, speechEngine: 'gemini' })}
                    className={`p-2 rounded-xl border text-center transition font-medium ${
                      settings.speechEngine === 'gemini'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Gemini AI TTS (Studio WAV)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, speechEngine: 'browser' })}
                    className={`p-2 rounded-xl border text-center transition font-medium ${
                      settings.speechEngine === 'browser'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Native Browser Speech
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Cloud Sync & Backup Vault */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5" />
              <span>{t.cloudSync}</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {settings.language === 'my' ? 'Cloud Vault အခြေအနေ' : 'Cloud Vault Sync'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {settings.lastCloudSync
                      ? `${settings.language === 'my' ? 'နောက်ဆုံး သိမ်းဆည်းချိန်:' : 'Last synced:'} ${new Date(
                          settings.lastCloudSync
                        ).toLocaleTimeString()}`
                      : 'Never synced'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloudSync}
                  disabled={syncStatus === 'syncing'}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-rose-950/30 transition"
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : syncStatus === 'success' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>{syncStatus === 'success' ? t.syncSuccess : t.syncNow}</span>
                </button>
              </div>

              {/* Offline Safe Notice */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <Database className="w-4 h-4 shrink-0" />
                <span>{t.allDataOfflineSafe}</span>
              </div>

              {/* JSON Backup Export & Import */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleExport}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.exportBackup}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.importBackup}</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json,application/json"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

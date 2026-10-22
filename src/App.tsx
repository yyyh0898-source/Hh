import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatView } from './components/ChatView.tsx';
import { MoodPickerModal } from './components/MoodPickerModal.tsx';
import { CharacterCreatorModal } from './components/CharacterCreatorModal.tsx';
import { CharacterProfileModal } from './components/CharacterProfileModal.tsx';
import { ImageGeneratorModal } from './components/ImageGeneratorModal.tsx';
import { SecurityLockModal } from './components/SecurityLockModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { StorageService } from './services/storage.ts';
import { Character, AppSettings, MoodType } from './types/character.ts';
import { ChatMessage } from './types/chat.ts';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>(() =>
    StorageService.getCharacters()
  );
  const [activeCharacterId, setActiveCharacterId] = useState<string>(() =>
    StorageService.getActiveCharacterId()
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    StorageService.getMessages(activeCharacterId)
  );
  const [settings, setSettings] = useState<AppSettings>(() =>
    StorageService.getSettings()
  );
  const [isLocked, setIsLocked] = useState<boolean>(() =>
    StorageService.isLocked()
  );

  // Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoodPickerOpen, setIsMoodPickerOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorMode, setCreatorMode] = useState<'ai' | 'manual'>('ai');
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isSetupPinOpen, setIsSetupPinOpen] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());

  // Active Character
  const activeCharacter =
    characters.find((c) => c.id === activeCharacterId) || characters[0] || null;

  // Whenever active character changes, load their messages
  useEffect(() => {
    if (activeCharacterId) {
      StorageService.setActiveCharacterId(activeCharacterId);
      setMessages(StorageService.getMessages(activeCharacterId));
    }
  }, [activeCharacterId]);

  // Persist settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  // Update messages
  const handleUpdateMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    if (activeCharacterId) {
      StorageService.saveMessages(activeCharacterId, newMessages);
    }
  };

  // Update character
  const handleUpdateCharacter = (updated: Character) => {
    const nextList = characters.map((c) => (c.id === updated.id ? updated : c));
    setCharacters(nextList);
    StorageService.saveCharacter(updated);
  };

  // Save new or edited character
  const handleSaveNewCharacter = (newChar: Character) => {
    const nextList = [newChar, ...characters.filter((c) => c.id !== newChar.id)];
    setCharacters(nextList);
    StorageService.saveCharacter(newChar);
    setActiveCharacterId(newChar.id);
  };

  // Delete character
  const handleDeleteCharacter = (id: string) => {
    StorageService.deleteCharacter(id);
    const remaining = characters.filter((c) => c.id !== id);
    setCharacters(remaining);
    if (activeCharacterId === id && remaining.length > 0) {
      setActiveCharacterId(remaining[0].id);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    if (!activeCharacter) return;
    const confirmText =
      settings.language === 'my'
        ? `${activeCharacter.burmeseName || activeCharacter.name} နှင့် စကားပြောမှတ်တမ်းများအားလုံးကို ဖျက်ရန် သေချာပါသလား?`
        : `Clear all chat history with ${activeCharacter.name}?`;

    if (confirm(confirmText)) {
      StorageService.clearMessages(activeCharacter.id);
      setMessages([]);
    }
  };

  // Auto-lock & Inactivity listeners
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // Handle tab visibility / blur
    const handleVisibilityChange = () => {
      if (document.hidden && settings.security?.isLockEnabled && settings.security?.pin) {
        if (settings.security.autoLockMinutes === 0) {
          setIsLocked(true);
          StorageService.setLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Inactivity check interval
    const interval = setInterval(() => {
      if (settings.security?.isLockEnabled && settings.security?.pin && !isLocked) {
        const timeoutMs = (settings.security.autoLockMinutes || 5) * 60 * 1000;
        if (Date.now() - lastActivityRef.current > timeoutMs) {
          setIsLocked(true);
          StorageService.setLocked(true);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [settings.security, isLocked]);

  // Set as avatar from Image Studio
  const handleSetAsAvatar = (imageUrl: string) => {
    if (activeCharacter) {
      handleUpdateCharacter({
        ...activeCharacter,
        avatar: imageUrl,
      });
      alert(
        settings.language === 'my'
          ? 'Avatar အသစ်ကို အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ!'
          : 'Avatar updated successfully!'
      );
    }
  };

  // Send Image Studio photo directly to active chat
  const handleSendImageToChat = (imageUrl: string, promptText: string) => {
    if (!activeCharacter) return;
    const photoMessage: ChatMessage = {
      id: 'photo-' + Date.now(),
      characterId: activeCharacter.id,
      role: 'model',
      content:
        settings.language === 'my'
          ? `*သင့်အတွက် ဖန်တီးထားသော ပုံရိပ်လေး ဖြစ်ပါတယ်:* "${promptText}"`
          : `*A visual moment created just for you:* "${promptText}"`,
      timestamp: Date.now(),
      image: imageUrl,
      detectedMood: activeCharacter.currentMood,
    };
    handleUpdateMessages([...messages, photoMessage]);
  };

  // When vault is restored
  const handleVaultRestored = () => {
    const freshChars = StorageService.getCharacters();
    setCharacters(freshChars);
    const freshSettings = StorageService.getSettings();
    setSettings(freshSettings);
    if (freshChars.length > 0) {
      setActiveCharacterId(freshChars[0].id);
      setMessages(StorageService.getMessages(freshChars[0].id));
    }
  };

  const isDark = settings.theme === 'dark';

  return (
    <div
      className={`h-screen flex flex-col font-sans transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800 light-mode'
      }`}
    >
      {/* App Header */}
      <Header
        activeCharacter={activeCharacter}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenMoodPicker={() => setIsMoodPickerOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onLockApp={() => {
          setIsLocked(true);
          StorageService.setLocked(true);
        }}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          characters={characters}
          activeCharacterId={activeCharacterId}
          settings={settings}
          isOpen={isSidebarOpen}
          onSelectCharacter={(id) => setActiveCharacterId(id)}
          onOpenCreator={(mode) => {
            setCreatorMode(mode);
            setIsCreatorOpen(true);
          }}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Chat Interface */}
        {activeCharacter ? (
          <ChatView
            character={activeCharacter}
            messages={messages}
            settings={settings}
            onUpdateCharacter={handleUpdateCharacter}
            onUpdateMessages={handleUpdateMessages}
            onClearChat={handleClearChat}
            onOpenMoodPicker={() => setIsMoodPickerOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenImageStudio={() => setIsImageStudioOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <p className="text-slate-400 text-sm">
              {settings.language === 'my'
                ? 'စကားပြောရန် ဇာတ်ကောင်တစ်ခု ရွေးချယ်ပါ'
                : 'Select a character to start chatting'}
            </p>
          </div>
        )}
      </div>

      {/* Mood Picker Modal */}
      {activeCharacter && (
        <MoodPickerModal
          isOpen={isMoodPickerOpen}
          character={activeCharacter}
          settings={settings}
          onClose={() => setIsMoodPickerOpen(false)}
          onSelectMood={(mood: MoodType) => {
            handleUpdateCharacter({
              ...activeCharacter,
              currentMood: mood,
            });
          }}
        />
      )}

      {/* Character Creator / Studio Modal */}
      <CharacterCreatorModal
        isOpen={isCreatorOpen}
        initialMode={creatorMode}
        settings={settings}
        onClose={() => setIsCreatorOpen(false)}
        onSaveCharacter={handleSaveNewCharacter}
      />

      {/* Character Profile Modal */}
      <CharacterProfileModal
        isOpen={isProfileOpen}
        character={activeCharacter}
        settings={settings}
        onClose={() => setIsProfileOpen(false)}
        onEdit={(char) => {
          setIsProfileOpen(false);
          setIsCreatorOpen(true);
          setCreatorMode('manual');
        }}
        onDelete={handleDeleteCharacter}
      />

      {/* Image & Visual Studio Modal */}
      <ImageGeneratorModal
        isOpen={isImageStudioOpen}
        character={activeCharacter}
        settings={settings}
        onClose={() => setIsImageStudioOpen(false)}
        onSetAsAvatar={handleSetAsAvatar}
        onSendToChat={handleSendImageToChat}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onTriggerSetupPin={() => {
          setIsSettingsOpen(false);
          setIsSetupPinOpen(true);
        }}
        onVaultRestored={handleVaultRestored}
      />

      {/* Security App Lock Screen (When locked) */}
      <SecurityLockModal
        isOpen={isLocked}
        securitySettings={settings.security}
        language={settings.language}
        onUnlock={() => {
          setIsLocked(false);
          StorageService.setLocked(false);
          lastActivityRef.current = Date.now();
        }}
      />

      {/* Setup PIN Modal */}
      <SecurityLockModal
        isOpen={isSetupPinOpen}
        securitySettings={settings.security}
        language={settings.language}
        isSetupMode={true}
        onSavePin={(newPin: string) => {
          handleUpdateSettings({
            ...settings,
            security: {
              ...settings.security,
              isLockEnabled: true,
              pin: newPin,
            },
          });
          setIsSetupPinOpen(false);
          alert(
            settings.language === 'my'
              ? 'PIN ကုဒ် သတ်မှတ်ခြင်း အောင်မြင်ပါသည်!'
              : 'PIN passcode setup successful!'
          );
        }}
        onCancelSetup={() => setIsSetupPinOpen(false)}
        onUnlock={() => setIsSetupPinOpen(false)}
      />
    </div>
  );
}

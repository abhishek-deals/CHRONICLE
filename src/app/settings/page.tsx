'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore, UserSettings } from '@/store/game';
import { toast } from 'sonner';

const DEFAULT_SETTINGS: UserSettings = {
  daily_goal: 5,
  difficulty_preference: 'Balanced',
  auto_quest_suggestions: true,
  theme: 'Midnight',
  color_accent: 'Purple',
  crt_effect: false,
  ui_mode: 'Comfortable',
  animations: true,
  master_volume: 80,
  music: true,
  sfx: true,
  ui_sounds: true,
  quest_reminders: true,
  achievement_notifications: true,
  level_up_notifications: true,
  campaign_reminders: true,
  reduce_motion: false,
  high_contrast: false,
  font_size: 'Normal'
};

const TABS = ['Gameplay', 'Appearance', 'Audio', 'Notifications', 'Accessibility', 'Account', 'Data'];

export default function SettingsPage() {
  const { settings, setSettings, profile, setProfile } = useGameStore();
  const [activeTab, setActiveTab] = useState('Gameplay');
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [localDisplayName, setLocalDisplayName] = useState('');

  // For controlled inputs before they are saved to store
  const [localSettings, setLocalSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const loaded = data.settings ?? DEFAULT_SETTINGS;
        setSettings(loaded);
        setLocalSettings(loaded);
      })
      .catch(err => console.error('Failed to load settings', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Fetch email once on mount from auth provider (Gmail etc.)
  useEffect(() => {
    const fetchUser = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    };
    fetchUser();
  }, []);

  // Fetch profile on mount if not already in store, so Account tab always shows name
  useEffect(() => {
    if (profile) {
      setLocalDisplayName(profile.username ?? '');
      return;
    }
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
          setLocalDisplayName(data.profile.username ?? '');
        }
      })
      .catch(err => console.error('Failed to load profile', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save settings
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings)
      });
      const data = await res.json();
      
      if (data.settings) {
        setSettings(data.settings);
        if (data.settings.crt_effect) {
          localStorage.setItem('chronicle-crt', 'true');
        } else {
          localStorage.removeItem('chronicle-crt');
        }
      }

      // Save display name if changed
      const currentName = profile?.username ?? '';
      if (localDisplayName.trim() && localDisplayName.trim() !== currentName) {
        const profileRes = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: localDisplayName.trim() })
        });
        const profileData = await profileRes.json();
        if (profileData.success) {
          if (profile) setProfile({ ...profile, username: profileData.username });
        } else {
          toast.error('Failed to update display name.');
        }
      }

      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocal = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <CRTOverlay enabled={localSettings.crt_effect} />
      <Sidebar />

      <main className="pb-24 md:pb-0 md:pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-game text-2xl text-white glow-purple">SETTINGS</h1>
              <p className="text-slate-400 text-sm mt-1">Configure your RPG experience</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary py-2 px-6 text-sm"
            >
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Desktop Tabs Sidebar */}
            <div className="hidden lg:flex flex-col w-64 space-y-2">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-4 py-3 rounded-lg font-game text-xs transition-colors focus-ring ${
                    activeTab === tab 
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Mobile Tabs Scroll */}
            <div className="lg:hidden flex overflow-x-auto hide-scrollbar space-x-2 pb-2">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg font-game text-[10px] transition-colors focus-ring ${
                    activeTab === tab 
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' 
                      : 'text-slate-400 bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card pixel-border p-6 sm:p-8 rounded-xl"
                >
                  <h2 className="font-game text-lg text-purple-300 mb-6 border-b border-purple-900/30 pb-4">
                    {activeTab.toUpperCase()}
                  </h2>

                  {/* GAMEPLAY */}
                  {activeTab === 'Gameplay' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Daily Quest Goal</label>
                        <select 
                          value={localSettings.daily_goal} 
                          onChange={(e) => updateLocal('daily_goal', Number(e.target.value))}
                          className="input-field text-sm w-full sm:w-64"
                        >
                          <option value={3}>3 Quests / Day</option>
                          <option value={5}>5 Quests / Day</option>
                          <option value={7}>7 Quests / Day</option>
                          <option value={10}>10 Quests / Day</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty Preference</label>
                        <select 
                          value={localSettings.difficulty_preference} 
                          onChange={(e) => updateLocal('difficulty_preference', e.target.value)}
                          className="input-field text-sm w-full sm:w-64"
                        >
                          <option value="Casual">Casual</option>
                          <option value="Balanced">Balanced</option>
                          <option value="Challenging">Challenging</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-purple-900/30">
                        <div>
                          <div className="text-sm text-slate-200">Auto-generate Suggested Quests</div>
                          <div className="text-xs text-slate-500">Let the Sage generate quests based on your campaigns.</div>
                        </div>
                        <Toggle 
                          checked={localSettings.auto_quest_suggestions} 
                          onChange={(v) => updateLocal('auto_quest_suggestions', v)} 
                        />
                      </div>
                    </div>
                  )}

                  {/* APPEARANCE */}
                  {activeTab === 'Appearance' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-purple-900/30">
                        <div>
                          <div className="text-sm text-slate-200">CRT Screen Effect</div>
                          <div className="text-xs text-slate-500">Scanlines and phosphor glow.</div>
                        </div>
                        <Toggle 
                          checked={localSettings.crt_effect} 
                          onChange={(v) => updateLocal('crt_effect', v)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-purple-900/30">
                        <div>
                          <div className="text-sm text-slate-200">Game Animations</div>
                          <div className="text-xs text-slate-500">Decorative animations and particles.</div>
                        </div>
                        <Toggle 
                          checked={localSettings.animations} 
                          onChange={(v) => updateLocal('animations', v)} 
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                        <select 
                          value={localSettings.theme} 
                          onChange={(e) => updateLocal('theme', e.target.value)}
                          className="input-field text-sm w-full sm:w-64"
                        >
                          <option value="Dungeon">Dungeon</option>
                          <option value="Forest">Forest</option>
                          <option value="Midnight">Midnight</option>
                          <option value="Arcane">Arcane</option>
                          <option value="Classic">Classic</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* AUDIO */}
                  {activeTab === 'Audio' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Master Volume: {localSettings.master_volume}%
                        </label>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={localSettings.master_volume}
                          onChange={(e) => updateLocal('master_volume', Number(e.target.value))}
                          className="w-full sm:w-64 accent-purple-500"
                        />
                      </div>

                      <div className="space-y-3">
                        {[
                          { key: 'music', label: 'Music' },
                          { key: 'sfx', label: 'Sound Effects' },
                          { key: 'ui_sounds', label: 'UI Sounds' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-purple-900/30">
                            <div className="text-sm text-slate-200">{label}</div>
                            <Toggle 
                              checked={localSettings[key as keyof UserSettings] as boolean} 
                              onChange={(v) => updateLocal(key as keyof UserSettings, v as UserSettings[keyof UserSettings])} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACCOUNT */}
                  {activeTab === 'Account' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <input
                          type="email"
                          disabled
                          value={userEmail}
                          placeholder={userEmail ? '' : 'Loading...'}
                          className="input-field text-sm w-full sm:w-96 opacity-50 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 mt-1">Managed via authentication provider.</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                        <input
                          type="text"
                          value={localDisplayName}
                          onChange={(e) => setLocalDisplayName(e.target.value)}
                          className="input-field text-sm w-full sm:w-96"
                        />
                      </div>
                    </div>
                  )}

                  {/* DATA */}
                  {activeTab === 'Data' && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-lg border border-red-900/50 bg-red-900/10">
                        <h3 className="font-game text-sm text-red-400 mb-2">DANGER ZONE</h3>
                        <p className="text-sm text-slate-400 mb-4">
                          Delete Account: This permanently removes your Chronicle account and all associated progress. This action cannot be undone.
                        </p>
                        <button className="btn-secondary text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-900/20 px-6 py-2 text-sm">
                          DELETE ACCOUNT
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTIFICATIONS */}
                  {activeTab === 'Notifications' && (
                    <div className="space-y-3">
                      {[
                        { key: 'quest_reminders', label: 'Quest Reminders', desc: 'Daily nudges to complete tasks.' },
                        { key: 'achievement_notifications', label: 'Achievement Notifications', desc: 'Alerts when you unlock new titles or feats.' },
                        { key: 'level_up_notifications', label: 'Level Up Notifications', desc: 'Alerts when you grow in power.' },
                        { key: 'campaign_reminders', label: 'Campaign Reminders', desc: 'Updates on ongoing sagas.' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-purple-900/30">
                          <div>
                            <div className="text-sm text-slate-200">{label}</div>
                            <div className="text-xs text-slate-500">{desc}</div>
                          </div>
                          <Toggle 
                            checked={localSettings[key as keyof UserSettings] as boolean} 
                            onChange={(v) => updateLocal(key as keyof UserSettings, v as UserSettings[keyof UserSettings])} 
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ACCESSIBILITY */}
                  {activeTab === 'Accessibility' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        {[
                          { key: 'reduce_motion', label: 'Reduce Motion', desc: 'Minimize UI animations.' },
                          { key: 'high_contrast', label: 'High Contrast Mode', desc: 'Increase text legibility.' },
                        ].map(({ key, label, desc }) => (
                          <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-purple-900/30">
                            <div>
                              <div className="text-sm text-slate-200">{label}</div>
                              <div className="text-xs text-slate-500">{desc}</div>
                            </div>
                            <Toggle 
                              checked={localSettings[key as keyof UserSettings] as boolean} 
                              onChange={(v) => updateLocal(key as keyof UserSettings, v as UserSettings[keyof UserSettings])} 
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Font Size</label>
                        <select 
                          value={localSettings.font_size} 
                          onChange={(e) => updateLocal('font_size', e.target.value)}
                          className="input-field text-sm w-full sm:w-64"
                        >
                          <option value="Small">Small</option>
                          <option value="Normal">Normal</option>
                          <option value="Large">Large</option>
                        </select>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

// Simple toggle component for settings
function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-ring ${
        checked ? 'bg-purple-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

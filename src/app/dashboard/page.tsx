'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { XpBar } from '@/components/XpBar';
import { QuestCard } from '@/components/QuestCard';
import { LevelUpModal } from '@/components/LevelUpModal';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore, CompleteResult } from '@/store/game';
import { xpProgress } from '@/lib/rpg';

const ATTR_CONFIG = [
  { key: 'intellect',  label: 'INTELLECT',  icon: '🧠', color: '#3b82f6', class: 'bg-blue-500' },
  { key: 'strength',   label: 'STRENGTH',   icon: '💪', color: '#ef4444', class: 'bg-red-500'  },
  { key: 'discipline', label: 'DISCIPLINE', icon: '🎯', color: '#a855f7', class: 'bg-purple-500' },
  { key: 'creativity', label: 'CREATIVITY', icon: '🎨', color: '#f59e0b', class: 'bg-yellow-500' },
] as const;

export default function DashboardPage() {
  const {
    profile, attributes, streak, tasks,
    setProfile, setAttributes, setStreak, setTasks,
    isLoading, setLoading,
  } = useGameStore();

  const router = useRouter();
  const [levelUpTarget, setLevelUpTarget] = useState<number | null>(null);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Load data on mount
  useEffect(() => {
    const crtPref = localStorage.getItem('chronicle-crt') === 'true';
    setCrtEnabled(crtPref);
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setFetchError('');

    try {
      const [profileRes, tasksRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/tasks'),
      ]);

      if (profileRes.ok) {
        const { profile: p, attributes: a, streak: s } = await profileRes.json();
        setProfile(p);
        setAttributes(a);
        setStreak(s);
      } else {
        if (profileRes.status === 401) {
          // Not authenticated — redirect to login
          router.replace('/login');
          return;
        }
      }

      if (tasksRes.ok) {
        const { tasks: t } = await tasksRes.json();
        setTasks(t);
      }
    } catch (err) {
      setFetchError('Failed to load your adventure data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [setProfile, setAttributes, setStreak, setTasks, setLoading, router]);

  const handleQuestCompleted = useCallback((result: CompleteResult) => {
    if (result.level_up) {
      setLevelUpTarget(result.level);
    }
  }, []);

  const activeTasks = tasks.filter((t) => t.status === 'active');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const maxAttr = Math.max(
    ...(attributes ? Object.values(attributes).filter((v) => typeof v === 'number') : [100]),
    100
  );

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      {levelUpTarget && (
        <LevelUpModal
          level={levelUpTarget}
          onClose={() => setLevelUpTarget(null)}
        />
      )}
      <Sidebar />

      {/* Doctor Doom Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/doom-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Very light overlay — image stays fully visible, just enough tint for text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(5,2,17,0.35) 0%, rgba(5,2,17,0.25) 50%, rgba(5,2,17,0.40) 100%)',
          }}
        />
        {/* Subtle green edge vignette matching Doom's aura */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,20,10,0.55) 100%)',
          }}
        />
      </div>

      <main className="pb-20 md:pb-0 md:pl-64 min-h-screen relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {fetchError && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm flex items-center gap-3" role="alert">
              <span>⚠️ {fetchError}</span>
              <button
                onClick={loadDashboard}
                className="ml-auto underline hover:text-red-200 text-xs"
                aria-label="Retry loading dashboard"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Character Panel */}
            <div className="lg:col-span-1 space-y-5">
              {/* Character Card */}
              <div className="glass-card pixel-border p-6 rounded-xl">
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="skeleton h-6 w-40" />
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                ) : profile ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h1 className="font-game text-sm text-white mb-1 glow-purple">
                          {profile.username}
                        </h1>
                        <p className="text-slate-400 text-xs">Adventurer</p>
                      </div>
                      <div className="text-center">
                        <div className="font-game text-3xl text-purple-400 glow-purple">
                          {profile.level}
                        </div>
                        <div className="font-game text-xs text-purple-300">LEVEL</div>
                      </div>
                    </div>

                    <XpBar totalXp={profile.total_xp} level={profile.level} />

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-center">
                        <div className="font-game text-lg text-yellow-400 glow-gold">
                          💰 {profile.gold.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">GOLD</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <span className="flame-icon text-xl" aria-hidden="true">🔥</span>
                          <span className="font-game text-lg text-orange-400">
                            {streak?.current_streak ?? 0}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">DAY STREAK</div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Attributes */}
              <div className="glass-card p-5 rounded-xl">
                <h2 className="font-game text-xs text-purple-300 mb-4">ATTRIBUTES</h2>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map((i) => <div key={i} className="skeleton h-8 w-full" />)}
                  </div>
                ) : attributes ? (
                  <div className="space-y-4">
                    {ATTR_CONFIG.map((attr) => {
                      const val = attributes[attr.key as keyof typeof attributes] as number;
                      const pct = Math.min(100, (val / maxAttr) * 100);
                      return (
                        <div key={attr.key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">
                              {attr.icon} {attr.label}
                            </span>
                            <span className="text-slate-500">{val}</span>
                          </div>
                          <div className="attr-bar-track">
                            <motion.div
                              className="attr-bar-fill"
                              style={{ background: attr.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: 0.1 * ATTR_CONFIG.indexOf(attr) }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>


              {/* CRT Toggle */}
              <div className="glass-card p-4 rounded-lg flex items-center justify-between">
                <span className="text-xs text-slate-400">📺 CRT Scanlines</span>
                <button
                  id="crt-toggle-btn"
                  role="switch"
                  aria-checked={crtEnabled}
                  onClick={() => {
                    const next = !crtEnabled;
                    setCrtEnabled(next);
                    localStorage.setItem('chronicle-crt', String(next));
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-ring ${
                    crtEnabled ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle CRT scanline effect"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      crtEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* RIGHT: Quests */}
            <div className="lg:col-span-2 space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'TOTAL XP', value: profile?.total_xp.toLocaleString() ?? '—', icon: '⚡', color: 'text-emerald-400' },
                  { label: 'ACTIVE', value: isLoading ? '—' : activeTasks.length, icon: '📜', color: 'text-blue-400' },
                  { label: 'DONE', value: isLoading ? '—' : completedTasks.length, icon: '✓', color: 'text-purple-400' },
                ].map((s) => (
                  <div key={s.label} className="glass-card p-4 rounded-lg text-center">
                    <div className={`font-game text-lg ${s.color}`}>{s.icon} {s.value}</div>
                    <div className="font-game text-xs text-slate-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Active Quests */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-game text-sm text-white">ACTIVE QUESTS</h2>
                  <a href="/quests" className="text-purple-400 text-xs hover:text-purple-300 transition-colors focus-ring rounded">
                    + ADD QUEST
                  </a>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : activeTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-10 rounded-xl text-center"
                  >
                    <p className="text-4xl mb-4" aria-hidden="true">📜</p>
                    <p className="font-game text-xs text-slate-400 mb-3">NO ACTIVE QUESTS</p>
                    <p className="text-slate-500 text-sm mb-5">Your quest board is empty. Every legend starts with a single quest.</p>
                    <a href="/quests" className="btn-primary inline-block py-2 px-6">
                      ADD QUEST
                    </a>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {activeTasks.map((task) => (
                        <QuestCard
                          key={task.id}
                          task={task}
                          onCompleted={handleQuestCompleted}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Completed Quests (collapsed) */}
              {completedTasks.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer font-game text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 focus-ring rounded">
                    ▶ COMPLETED QUESTS ({completedTasks.length})
                  </summary>
                  <div className="mt-3 space-y-2 opacity-60">
                    {completedTasks.slice(0, 10).map((task) => (
                      <QuestCard key={task.id} task={task} />
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

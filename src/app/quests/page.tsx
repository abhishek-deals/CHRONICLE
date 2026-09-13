'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { QuestCard } from '@/components/QuestCard';
import { LevelUpModal } from '@/components/LevelUpModal';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore, CompleteResult, Task } from '@/store/game';
import { QUEST_REWARDS, CATEGORIES, ATTRIBUTE_TAGS } from '@/lib/rpg';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Epic'] as const;

export default function QuestsPage() {
  const { tasks, setTasks, addTask, setProfile, setAttributes, setStreak, profile } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [levelUpTarget, setLevelUpTarget] = useState<number | null>(null);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('General');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Epic'>('Easy');
  const [attributeTag, setAttributeTag] = useState<string>('discipline');
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    loadTasks();
  }, []);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const { tasks: t } = await res.json();
        setTasks(t);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setTasks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError('');
    setError('');

    if (!title.trim()) {
      setTitleError('Quest title cannot be empty');
      return;
    }

    setCreating(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          difficulty,
          attribute_tag: attributeTag,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create quest');
        return;
      }

      addTask(data.task);
      setTitle('');
      toast.success('Quest added to your board!', { icon: '📜' });
    } catch {
      setError('Network error — please try again');
    } finally {
      setCreating(false);
    }
  };

  const handleQuestCompleted = useCallback((result: CompleteResult) => {
    if (result.level_up) setLevelUpTarget(result.level);
  }, []);

  const activeTasks = tasks.filter((t) => t.status === 'active');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const reward = QUEST_REWARDS[difficulty];

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      {levelUpTarget && (
        <LevelUpModal level={levelUpTarget} onClose={() => setLevelUpTarget(null)} />
      )}
      <Sidebar />

      
      {/* Doctor Doom Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/doom-bg-2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Very light overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(5,2,17,0.35) 0%, rgba(5,2,17,0.25) 50%, rgba(5,2,17,0.40) 100%)',
          }}
        />
        {/* Subtle green edge vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,20,10,0.55) 100%)',
          }}
        />
      </div>

      <main
        className="pb-20 md:pb-0 md:pl-64 min-h-screen relative z-10"
       
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="font-game text-xl text-white glow-purple mb-2">📜 QUEST BOARD</h1>
            <p className="text-slate-400 text-sm">
              {activeTasks.length} active • {completedTasks.length} completed
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Create quest form */}
            <div className="lg:col-span-2">
              <div className="glass-card pixel-border p-6 rounded-xl sticky top-20">
                <h2 className="font-game text-xs text-purple-300 mb-5">NEW QUEST</h2>
                <form onSubmit={handleCreate} noValidate>
                  {/* Title */}
                  <div className="mb-4">
                    <label htmlFor="quest-title" className="block text-sm text-slate-300 mb-2">
                      Quest Title
                    </label>
                    <input
                      id="quest-title"
                      type="text"
                      className={`input-field ${titleError ? 'border-red-500' : ''}`}
                      placeholder="e.g. Read for 30 minutes"
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
                      disabled={creating}
                      aria-required="true"
                      aria-invalid={!!titleError}
                      aria-describedby={titleError ? 'title-error' : undefined}
                      maxLength={100}
                    />
                    {titleError && (
                      <p id="title-error" className="text-red-400 text-xs mt-1" role="alert">{titleError}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <label htmlFor="quest-category" className="block text-sm text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      id="quest-category"
                      className="input-field"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={creating}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="mb-4">
                    <label htmlFor="quest-difficulty" className="block text-sm text-slate-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      id="quest-difficulty"
                      className="input-field"
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                      disabled={creating}
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Attribute */}
                  <div className="mb-4">
                    <label htmlFor="quest-attribute" className="block text-sm text-slate-300 mb-2">
                      Trains Attribute
                    </label>
                    <select
                      id="quest-attribute"
                      className="input-field"
                      value={attributeTag}
                      onChange={(e) => setAttributeTag(e.target.value)}
                      disabled={creating}
                    >
                      {ATTRIBUTE_TAGS.map((a) => (
                        <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Reward preview (read-only — server controls actual values) */}
                  <div className="mb-5 p-3 rounded-lg bg-purple-900/20 border border-purple-800/30">
                    <p className="text-xs text-slate-400 mb-1">Quest Reward</p>
                    <div className="flex gap-4">
                      <span className="text-emerald-400 font-game text-xs">+{reward.xp} XP</span>
                      <span className="text-yellow-400 font-game text-xs">+{reward.gold} Gold</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Server-verified on completion</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-xs" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    id="create-quest-btn"
                    type="submit"
                    className="btn-primary w-full py-3"
                    disabled={creating}
                    aria-busy={creating}
                  >
                    {creating ? 'CREATING...' : '+ ADD QUEST'}
                  </button>
                </form>
              </div>
            </div>

            {/* Quest list */}
            <div className="lg:col-span-3 space-y-4">
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-24 w-full rounded-lg" />
                  ))}
                </>
              ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 rounded-xl text-center"
                >
                  <p className="text-5xl mb-5" aria-hidden="true">📜</p>
                  <p className="font-game text-xs text-slate-400 mb-3">QUEST BOARD IS EMPTY</p>
                  <p className="text-slate-500 text-sm">
                    Your quest board is empty. Add your first quest.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Active */}
                  {activeTasks.length > 0 && (
                    <div>
                      <h3 className="font-game text-xs text-slate-400 mb-3">
                        ACTIVE ({activeTasks.length})
                      </h3>
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
                    </div>
                  )}

                  {/* Completed */}
                  {completedTasks.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-game text-xs text-slate-400 mb-3">
                        COMPLETED ({completedTasks.length})
                      </h3>
                      <div className="space-y-2 opacity-60">
                        {completedTasks.map((task) => (
                          <QuestCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

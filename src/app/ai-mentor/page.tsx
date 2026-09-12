'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore } from '@/store/game';
import { QUEST_REWARDS } from '@/lib/rpg';

interface SuggestedQuest {
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  attribute_tag: string;
  reason: string;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard', Epic: 'badge-epic'
};

const ATTR_ICONS: Record<string, string> = {
  intellect: '🧠', strength: '💪', discipline: '🎯', creativity: '🎨'
};

const SAGE_MESSAGES = [
  'Ah, a seeker of wisdom approaches...',
  'The path to greatness is forged one quest at a time.',
  'Your weakest attribute calls to be strengthened.',
  'I sense great potential within you, Adventurer.',
];

export default function AIMentorPage() {
  const { addTask } = useGameStore();
  const [quests, setQuests] = useState<SuggestedQuest[]>([]);
  const [weakest, setWeakest] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(new Set());
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [sageMessage] = useState(
    () => SAGE_MESSAGES[Math.floor(Math.random() * SAGE_MESSAGES.length)]
  );

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
  }, []);

  const handleSuggest = async () => {
    setIsLoading(true);
    setQuests([]);
    setAcceptedIds(new Set());

    try {
      const res = await fetch('/api/ai/suggest-quests', { method: 'POST' });
      const data = await res.json();

      setQuests(data.quests || []);
      setWeakest(data.weakest || '');
      setIsFallback(data.fallback || false);
    } catch {
      toast.error('Sage is unavailable — showing backup quests');
      setIsFallback(true);
      setQuests([
        { title: 'Read for 30 minutes', category: 'Learning', difficulty: 'Easy', attribute_tag: 'intellect', reason: 'Keep your mind sharp.' },
        { title: 'Do 20 push-ups', category: 'Fitness', difficulty: 'Easy', attribute_tag: 'strength', reason: 'Build physical strength.' },
        { title: 'Work on a creative project', category: 'Creative', difficulty: 'Medium', attribute_tag: 'creativity', reason: 'Express your inner hero.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (quest: SuggestedQuest, index: number) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quest.title,
          category: quest.category,
          difficulty: quest.difficulty,
          attribute_tag: quest.attribute_tag,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to accept quest');
        return;
      }

      const { task } = await res.json();
      addTask(task);
      setAcceptedIds((prev) => new Set([...prev, index]));
      toast.success(`Quest accepted: ${quest.title}`, { icon: '📜' });
    } catch {
      toast.error('Network error — please try again');
    }
  };

  const reward = (difficulty: string) =>
    QUEST_REWARDS[difficulty as keyof typeof QUEST_REWARDS] ?? { xp: 10, gold: 5 };

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Navbar />

      <main
        className="pt-14 min-h-screen"
        style={{ background: 'radial-gradient(ellipse at top, #0a1a2e 0%, #050211 70%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-game text-xl text-blue-400 text-center mb-2" style={{ textShadow: '0 0 20px rgba(59,130,246,0.8)' }}>
            🔮 THE SAGE
          </h1>
          <p className="text-center text-slate-400 text-sm mb-8">AI-Powered Quest Mentor</p>

          {/* Sage Avatar */}
          <div className="glass-card pixel-border p-8 rounded-xl mb-6 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(10, 26, 46, 0.95), rgba(5, 2, 17, 0.95))' }}
          >
            <motion.div
              className="text-8xl mb-4 inline-block"
              animate={{ y: [0, -6, 0], filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              🧙
            </motion.div>
            <p className="font-game text-xs text-blue-300 mb-2">SAGE</p>
            <p className="text-slate-300 text-sm italic mb-6">
              &ldquo;{sageMessage}&rdquo;
            </p>

            <button
              id="suggest-quests-btn"
              className="btn-primary px-8 py-3"
              onClick={handleSuggest}
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label="Ask Sage to suggest 3 quests based on your weakest attribute"
            >
              {isLoading ? '🔮 CONSULTING THE ORACLE...' : '✨ SUGGEST 3 QUESTS'}
            </button>

            {weakest && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-500 mt-3"
              >
                Focusing on your{' '}
                <span className="text-blue-400 font-medium">
                  {ATTR_ICONS[weakest]} {weakest}
                </span>
                {' '}attribute
                {isFallback && ' (using backup suggestions)'}
              </motion.p>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-32 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Quest suggestions */}
          <AnimatePresence>
            {!isLoading && quests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="font-game text-xs text-slate-400 mb-4">
                  THE SAGE&apos;S RECOMMENDATIONS
                </h2>
                {quests.map((quest, i) => {
                  const accepted = acceptedIds.has(i);
                  const r = reward(quest.difficulty);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: accepted ? 0.6 : 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-5 rounded-xl"
                      style={{ borderColor: accepted ? 'rgba(16,185,129,0.4)' : undefined }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`badge ${DIFF_COLORS[quest.difficulty] || 'badge-easy'}`}>
                              {quest.difficulty}
                            </span>
                            <span className="text-slate-500 text-xs">{quest.category}</span>
                            <span className="text-xs text-slate-500">
                              {ATTR_ICONS[quest.attribute_tag]} {quest.attribute_tag}
                            </span>
                          </div>
                          <p className="text-slate-100 font-medium mb-2">{quest.title}</p>
                          {quest.reason && (
                            <p className="text-xs text-slate-500 italic">&ldquo;{quest.reason}&rdquo;</p>
                          )}
                          <p className="text-xs mt-2">
                            <span className="text-emerald-400">+{r.xp} XP</span>
                            {' • '}
                            <span className="text-yellow-400">+{r.gold} Gold</span>
                          </p>
                        </div>

                        <button
                          id={`accept-quest-${i}`}
                          className={`flex-shrink-0 ${accepted ? 'btn-success opacity-60' : 'btn-gold'} text-xs py-2 px-4`}
                          onClick={() => handleAccept(quest, i)}
                          disabled={accepted}
                          aria-label={accepted ? `Quest accepted: ${quest.title}` : `Accept quest: ${quest.title}`}
                        >
                          {accepted ? '✓ ACCEPTED' : 'ACCEPT'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!isLoading && quests.length === 0 && (
            <div className="glass-card p-10 rounded-xl text-center opacity-60">
              <p className="text-4xl mb-4" aria-hidden="true">🔮</p>
              <p className="text-slate-500 text-sm">
                Press the button to receive the Sage&apos;s wisdom
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

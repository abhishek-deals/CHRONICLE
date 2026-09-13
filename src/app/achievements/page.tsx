'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore } from '@/store/game';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

interface Stats {
  level: number;
  gold: number;
  total_completed: number;
  epic_completed: number;
  hard_completed: number;
  longest_streak: number;
  intellect: number;
  strength: number;
  discipline: number;
  creativity: number;
}

const CATEGORIES = ['ALL', 'Milestone', 'Consistency', 'Attribute', 'Special'];

const CATEGORY_COLORS: Record<string, string> = {
  Milestone:   'text-blue-400 bg-blue-900/30 border-blue-700/40',
  Consistency: 'text-orange-400 bg-orange-900/30 border-orange-700/40',
  Attribute:   'text-green-400 bg-green-900/30 border-green-700/40',
  Special:     'text-yellow-400 bg-yellow-900/30 border-yellow-700/40',
};

export default function AchievementsPage() {
  const { profile } = useGameStore();
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    loadAchievements();
  }, [profile]);

  const loadAchievements = () => {
    setLoading(true);
    fetch('/api/achievements')
      .then(res => res.json())
      .then(data => {
        if (data.achievements) setAchievements(data.achievements);
        if (data.stats) setStats(data.stats);
      })
      .catch(() => toast.error('Failed to load achievements'))
      .finally(() => setLoading(false));
  };

  const filtered = achievements.filter(a => {
    if (showUnlockedOnly && !a.unlocked) return false;
    if (filter === 'ALL') return true;
    return a.category === filter;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />

      <main
        className="pb-24 md:pb-0 md:pl-64 min-h-screen"
        style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #050211 60%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-game text-2xl text-white glow-purple">HALL OF VALOR</h1>
              <p className="text-slate-400 text-sm mt-1">Your earned badges of honor and legend</p>
            </div>
            <div className="glass-card px-5 py-3 rounded-xl text-center self-start">
              <div className="font-game text-2xl text-yellow-400 glow-gold">{unlockedCount}/{totalCount}</div>
              <div className="text-[10px] font-game text-slate-500 mt-0.5">ACHIEVEMENTS</div>
            </div>
          </div>

          {/* ── Overall Progress Bar ── */}
          <div className="glass-card p-5 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-game text-xs text-purple-300">OVERALL COMPLETION</span>
              <span className="font-game text-sm text-white">{completionPct}%</span>
            </div>
            <div className="h-3 bg-black/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)' }}
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>

            {/* Stats Row */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'QUESTS DONE', value: stats.total_completed, icon: '📜', color: 'text-blue-400' },
                  { label: 'BEST STREAK', value: `${stats.longest_streak}d`, icon: '🔥', color: 'text-orange-400' },
                  { label: 'LEVEL', value: stats.level, icon: '⚡', color: 'text-emerald-400' },
                  { label: 'GOLD', value: stats.gold.toLocaleString(), icon: '💰', color: 'text-yellow-400' },
                ].map(s => (
                  <div key={s.label} className="bg-black/30 rounded-lg p-3 text-center border border-purple-900/20">
                    <div className={`font-game text-lg ${s.color}`}>{s.icon} {s.value}</div>
                    <div className="text-[10px] font-game text-slate-600 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar flex-1">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`px-4 py-2 rounded-full font-game text-xs transition-all whitespace-nowrap focus-ring ${
                    filter === c
                      ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                      : 'bg-black/30 text-slate-400 border border-purple-900/30 hover:bg-purple-900/30'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className={`px-4 py-2 rounded-full font-game text-xs transition-all flex-shrink-0 focus-ring ${
                showUnlockedOnly
                  ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-700/50'
                  : 'bg-black/30 text-slate-400 border border-purple-900/30 hover:bg-yellow-900/20'
              }`}
            >
              🏆 UNLOCKED ONLY
            </button>
          </div>

          {/* ── Achievement Grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="skeleton h-36 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-12 rounded-xl text-center">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-game text-sm text-purple-300 mb-2">NO ACHIEVEMENTS HERE</p>
              <p className="text-slate-500 text-sm">Complete quests to unlock achievements in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence>
                {filtered.map((a, idx) => (
                  <AchievementCard key={a.id} achievement={a} idx={idx} />
                ))}
              </AnimatePresence>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

function AchievementCard({ achievement: a, idx }: { achievement: Achievement; idx: number }) {
  const isUnlocked = a.unlocked;
  const categoryStyle = CATEGORY_COLORS[a.category] || 'text-slate-400 bg-slate-900/30 border-slate-700/40';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: idx * 0.04, duration: 0.3 }}
      className={`relative p-5 rounded-xl border transition-all ${
        isUnlocked
          ? 'bg-gradient-to-br from-purple-900/30 to-black/60 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.12)]'
          : 'bg-black/40 border-slate-800/50'
      }`}
    >
      {/* Unlocked glow shimmer */}
      {isUnlocked && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-10 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #a855f7, transparent, #7c3aed)' }}
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      <div className="flex items-start gap-4 relative z-10">
        {/* Icon */}
        <motion.div
          className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl ${
            isUnlocked
              ? 'border-yellow-500/60 bg-black/60 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
              : 'border-slate-700/50 bg-black/20 opacity-40 grayscale'
          }`}
          animate={isUnlocked ? { boxShadow: ['0 0 10px rgba(234,179,8,0.2)', '0 0 20px rgba(234,179,8,0.35)', '0 0 10px rgba(234,179,8,0.2)'] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {a.icon}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <span className={`inline-block text-[9px] font-game px-2 py-0.5 rounded-full border mb-1.5 ${categoryStyle}`}>
            {a.category.toUpperCase()}
          </span>

          <h3 className={`font-game text-sm leading-tight mb-1 ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
            {a.title}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            {a.description}
          </p>

          {/* Progress bar (only when not unlocked) */}
          {!isUnlocked && (
            <div>
              <div className="flex justify-between text-[9px] font-game text-slate-600 mb-1">
                <span>PROGRESS</span>
                <span>{a.progress}%</span>
              </div>
              <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-slate-800/50">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-700 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${a.progress}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                />
              </div>
            </div>
          )}

          {/* Unlocked date */}
          {isUnlocked && a.unlocked_at && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-yellow-400 text-xs">✨</span>
              <span className="text-[10px] font-game text-yellow-500/80">
                UNLOCKED {new Date(a.unlocked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

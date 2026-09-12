'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { CRTOverlay } from '@/components/CRTOverlay';
import Confetti from '@/components/Confetti';
import { useGameStore, Boss } from '@/store/game';
import { toast } from 'sonner';

const BOSS_SPRITES: Record<string, string> = {
  'Shadow Sloth':              '🦥',
  'Procrastinax the Terrible': '👾',
  'Lord Laziness':             '👑',
  'The Distraction Drake':     '🐉',
  'Megaslack the Unmotivated': '💤',
  'Baron Von Burnout':         '🔥',
  'The Apathy Ogre':           '👺',
  'Chaos Goblin':              '👹',
};

function getBossSprite(name: string): string {
  return BOSS_SPRITES[name] ?? '👹';
}

export default function BossPage() {
  const { boss, setBoss, tasks } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showVictory, setShowVictory] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number; value: number; x: number; y: number }[]>([]);
  const [pastBosses, setPastBosses] = useState<Boss[]>([]);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const bossRef = useRef<HTMLDivElement>(null);
  const dmgIdRef = useRef(0);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    loadBoss();
    loadPastBosses();
  }, []);

  const loadBoss = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/boss');
      if (res.ok) {
        const { boss: b } = await res.json();
        const wasDefeated = boss?.status === 'active' && b?.status === 'defeated';
        setBoss(b);
        if (wasDefeated || b?.status === 'defeated') {
          setShowVictory(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [boss, setBoss]);

  const loadPastBosses = async () => {
    try {
      const res = await fetch('/api/boss/past');
      if (res.ok) {
        const { bosses } = await res.json();
        setPastBosses(bosses || []);
      }
    } catch {}
  };

  const triggerDamage = useCallback((amount: number) => {
    // Shake the boss sprite
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 700);

    // Show damage number
    const rect = bossRef.current?.getBoundingClientRect();
    if (rect) {
      const id = ++dmgIdRef.current;
      const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
      const y = rect.top + rect.height / 2;
      setDamageNumbers((prev) => [...prev, { id, value: amount, x, y }]);
      setTimeout(() => {
        setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
      }, 1400);
    }
  }, []);

  const completedThisWeek = tasks.filter(
    (t) => t.status === 'completed' && t.completed_at &&
      new Date(t.completed_at) >= new Date(boss?.week_start || '')
  );

  const hpPct = boss ? Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100)) : 0;
  const sprite = boss ? getBossSprite(boss.name) : '👹';

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      {showVictory && <Confetti />}
      <Navbar />

      {/* Damage floating numbers (fixed to viewport) */}
      {damageNumbers.map((d) => (
        <div
          key={d.id}
          className="damage-number"
          style={{ left: d.x, top: d.y }}
          aria-live="assertive"
          aria-label={`${d.value} damage dealt`}
        >
          -{d.value}
        </div>
      ))}

      <main
        className="pt-14 min-h-screen"
        style={{
          background: 'radial-gradient(ellipse at center, #2d0a0a 0%, #1a0505 40%, #050211 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-game text-xl text-red-400 text-center mb-8" style={{ textShadow: '0 0 20px rgba(239,68,68,0.8)' }}>
            ⚔️ BOSS BATTLE
          </h1>

          {isLoading ? (
            <div className="space-y-4">
              <div className="skeleton h-64 w-full rounded-xl" />
              <div className="skeleton h-32 w-full rounded-xl" />
            </div>
          ) : !boss ? (
            <div className="glass-card p-10 rounded-xl text-center">
              <p className="text-4xl mb-4">😴</p>
              <p className="font-game text-xs text-slate-400">NO BOSS THIS WEEK</p>
              <p className="text-slate-500 text-sm mt-2">Add some quests to summon a boss!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Boss card */}
              <div
                className={`glass-card p-8 rounded-xl text-center relative overflow-hidden ${
                  boss.status === 'defeated' ? 'pixel-border-gold victory-glow' : 'pixel-border'
                }`}
                style={{
                  background: boss.status === 'defeated'
                    ? 'linear-gradient(135deg, rgba(26, 10, 0, 0.95), rgba(45, 22, 0, 0.95))'
                    : 'linear-gradient(135deg, rgba(45, 10, 10, 0.9), rgba(26, 5, 5, 0.9))',
                }}
              >
                {/* Boss sprite */}
                <motion.div
                  ref={bossRef}
                  className={`text-9xl mb-6 inline-block select-none ${isShaking ? 'boss-shake' : ''}`}
                  animate={boss.status === 'active' ? {
                    y: [0, -8, 0],
                    filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
                  } : { filter: 'grayscale(1)', opacity: 0.5 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  aria-label={`Boss: ${boss.name}`}
                  role="img"
                >
                  {boss.status === 'defeated' ? '💀' : sprite}
                </motion.div>

                <h2 className="font-game text-lg text-white mb-1">
                  {boss.name}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Week of {new Date(boss.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>

                {boss.status === 'active' ? (
                  <>
                    {/* HP bar */}
                    <div className="mb-2 flex justify-between text-xs text-slate-400">
                      <span className="font-game">HP</span>
                      <span>{boss.current_hp.toLocaleString()} / {boss.max_hp.toLocaleString()}</span>
                    </div>
                    <div className="boss-hp-track mb-6">
                      <motion.div
                        className="boss-hp-fill"
                        animate={{ width: `${hpPct}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>

                    <p className="text-slate-400 text-sm">
                      ⚔️ Complete quests to deal damage!
                      <br />
                      <span className="text-xs text-slate-500 mt-1 block">
                        Each quest deals XP damage. Epic quests hit hardest.
                      </span>
                    </p>
                  </>
                ) : (
                  <div className="py-4">
                    <p className="font-game text-xl text-yellow-400 glow-gold mb-3">DEFEATED!</p>
                    <p className="text-yellow-200 text-sm">+50 bonus Gold awarded!</p>
                    <p className="text-slate-400 text-sm mt-2">A new boss arrives next week.</p>
                  </div>
                )}
              </div>

              {/* This week's completed quests / damage log */}
              <div className="glass-card p-5 rounded-xl">
                <h3 className="font-game text-xs text-slate-400 mb-4">
                  ⚡ DAMAGE DEALT THIS WEEK ({completedThisWeek.length} quests)
                </h3>
                {completedThisWeek.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">
                    Complete quests to damage the boss!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {completedThisWeek.map((t) => {
                      const dmg = t.difficulty === 'Easy' ? 10 : t.difficulty === 'Medium' ? 25 : t.difficulty === 'Hard' ? 50 : 100;
                      return (
                        <div key={t.id} className="flex justify-between items-center py-2 border-b border-purple-900/30">
                          <span className="text-sm text-slate-300 truncate mr-4">{t.title}</span>
                          <span className="text-red-400 font-game text-xs flex-shrink-0">-{dmg} HP</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Past bosses */}
              {pastBosses.length > 0 && (
                <div className="glass-card p-5 rounded-xl">
                  <h3 className="font-game text-xs text-slate-400 mb-4">🏆 PAST VICTORIES</h3>
                  <div className="space-y-2">
                    {pastBosses.slice(0, 5).map((pb) => (
                      <div key={pb.id} className="flex items-center justify-between py-2 border-b border-purple-900/30">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl" aria-hidden="true">{getBossSprite(pb.name)}</span>
                          <span className="text-sm text-slate-300">{pb.name}</span>
                        </div>
                        <span className="text-emerald-400 text-xs font-game">SLAIN</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

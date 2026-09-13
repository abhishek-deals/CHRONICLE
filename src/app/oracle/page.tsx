'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';

type BuffType =
  | 'the_chariot'
  | 'the_merchant'
  | 'the_emperor'
  | 'the_fool'
  | 'the_magician'
  | 'the_hermit';

interface Buff {
  id: BuffType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const BUFFS: Buff[] = [
  {
    id: 'the_chariot',
    name: 'The Chariot',
    description: '+50% XP from all quests for 24 hours.',
    icon: '🏇',
    color: 'from-blue-600 to-cyan-400',
  },
  {
    id: 'the_merchant',
    name: 'The Merchant',
    description: '+50% Gold from all quests for 24 hours.',
    icon: '⚖️',
    color: 'from-yellow-600 to-amber-400',
  },
  {
    id: 'the_emperor',
    name: 'The Emperor',
    description: '+25% XP and Gold from all quests for 24 hours.',
    icon: '👑',
    color: 'from-purple-600 to-fuchsia-400',
  },
  {
    id: 'the_fool',
    name: 'The Fool',
    description: '+100% XP for 24 hours, but gold is reduced by 50%.',
    icon: '🃏',
    color: 'from-green-600 to-emerald-400',
  },
  {
    id: 'the_magician',
    name: 'The Magician',
    description: '+50% XP and Gold for Intellect and Creativity quests.',
    icon: '🪄',
    color: 'from-pink-600 to-rose-400',
  },
  {
    id: 'the_hermit',
    name: 'The Hermit',
    description: '-50% Gold but +100% XP for Discipline quests.',
    icon: '🏔️',
    color: 'from-slate-600 to-gray-400',
  },
];

export default function OraclePage() {
  const [activeBuff, setActiveBuff] = useState<Buff | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(false);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');

    const storedBuff = localStorage.getItem('oracle_active_buff');
    const drawDate = localStorage.getItem('oracle_draw_date');
    const today = new Date().toDateString();

    if (storedBuff && drawDate === today) {
      const buff = BUFFS.find((b) => b.id === storedBuff);
      if (buff) {
        setActiveBuff(buff);
        setIsFlipped(true);
        setCooldown(true);
      }
    } else if (drawDate !== today) {
      localStorage.removeItem('oracle_active_buff');
    }
  }, []);

  const drawCard = () => {
    if (cooldown || drawing) return;
    setDrawing(true);

    const randomBuff = BUFFS[Math.floor(Math.random() * BUFFS.length)];
    setActiveBuff(randomBuff);

    localStorage.setItem('oracle_active_buff', randomBuff.id);
    localStorage.setItem('oracle_draw_date', new Date().toDateString());

    setTimeout(() => {
      setIsFlipped(true);
      setDrawing(false);
      setCooldown(true);
      toast.success(`${randomBuff.name} drawn! Buff active for 24 hours.`, {
        icon: '🔮',
      });
    }, 1500);
  };

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
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

      <main className="pb-24 md:pb-0 md:pl-64 min-h-screen relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-game text-4xl text-fuchsia-400 glow-purple mb-4">
              THE DESTINY ORACLE
            </h1>
            <p className="text-slate-400">
              Draw a card daily to weave a powerful buff into your fate.
            </p>
          </div>

          {/* Active Buff Banner */}
          {cooldown && activeBuff && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-card p-4 rounded-xl border border-white/10 bg-gradient-to-r ${activeBuff.color} bg-opacity-20 flex items-center gap-4`}
            >
              <span className="text-3xl">{activeBuff.icon}</span>
              <div>
                <p className="font-game text-sm text-white">{activeBuff.name} — ACTIVE</p>
                <p className="text-xs text-white/70 mt-0.5">{activeBuff.description}</p>
              </div>
              <span className="ml-auto font-game text-xs text-emerald-300">UNTIL MIDNIGHT</span>
            </motion.div>
          )}

          {/* Card Arena */}
          <div className="relative bg-black/40 border border-slate-800 rounded-2xl min-h-[500px] flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* Mystic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-black to-black opacity-80" />

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-fuchsia-400"
                  style={{
                    left: `${(i * 8.33) % 100}%`,
                    top: `${(i * 13.7) % 100}%`,
                  }}
                  animate={{ y: [0, -20, 0], opacity: [0, 0.8, 0] }}
                  transition={{
                    duration: 3 + (i % 3),
                    repeat: Infinity,
                    delay: (i * 0.3) % 2,
                  }}
                />
              ))}
            </div>

            {/* 3D Card */}
            <div
              className="relative z-10 w-64 h-96 cursor-pointer select-none"
              style={{ perspective: '1000px' }}
              onClick={drawCard}
              role="button"
              aria-label={cooldown ? 'Buff already drawn today' : 'Draw your destiny card'}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  drawCard();
                }
              }}
            >
              <motion.div
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                  y: drawing ? [0, -20, 0, -20, 0] : [0, -10, 0],
                }}
                transition={{
                  rotateY: { duration: 0.8, ease: 'easeInOut' },
                  y: drawing
                    ? { duration: 1.5 }
                    : { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                {/* Card Front (back design) */}
                <div
                  className="absolute inset-0 w-full h-full rounded-xl border-2 border-fuchsia-900/50 flex items-center justify-center bg-[#0a0118] overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute inset-1 border border-fuchsia-500/20 rounded-lg m-2 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-fuchsia-500/30 flex items-center justify-center">
                      <span className="text-3xl animate-pulse">👁️</span>
                    </div>
                  </div>
                </div>

                {/* Card Back (revealed buff) */}
                <div
                  className={`absolute inset-0 w-full h-full rounded-xl border-2 border-white/20 flex flex-col items-center justify-center bg-gradient-to-br ${
                    activeBuff?.color || 'from-slate-800 to-slate-900'
                  } overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {activeBuff && (
                    <>
                      <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent" />
                      <span className="text-7xl mb-6 relative z-10 drop-shadow-xl">
                        {activeBuff.icon}
                      </span>
                      <div className="relative z-10 text-center px-4">
                        <h2 className="font-game text-xl text-white mb-2">{activeBuff.name}</h2>
                        <p className="text-xs text-white/90 font-medium bg-black/30 p-2 rounded-lg backdrop-blur-sm">
                          {activeBuff.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Status Text */}
            <div className="mt-12 h-8 z-10">
              <AnimatePresence mode="wait">
                {!cooldown && !drawing && (
                  <motion.p
                    key="prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-fuchsia-400 text-sm font-game animate-pulse"
                  >
                    CLICK THE CARD TO REVEAL YOUR DESTINY
                  </motion.p>
                )}
                {drawing && (
                  <motion.p
                    key="drawing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-slate-400 text-sm"
                  >
                    The spirits are deciding your fate...
                  </motion.p>
                )}
                {cooldown && activeBuff && (
                  <motion.p
                    key="active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-emerald-400 text-sm font-game"
                  >
                    BUFF ACTIVE UNTIL MIDNIGHT
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* All Available Buffs Reference */}
          <div className="glass-card p-6 rounded-xl">
            <h2 className="font-game text-xs text-purple-300 mb-4">ALL POSSIBLE BUFFS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BUFFS.map((buff) => {
                const isActive = activeBuff?.id === buff.id && cooldown;
                return (
                  <div
                    key={buff.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'border-emerald-500/50 bg-emerald-900/20'
                        : 'border-purple-900/30 bg-black/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{buff.icon}</span>
                      <span className="font-game text-xs text-white">{buff.name}</span>
                      {isActive && (
                        <span className="ml-auto text-[9px] font-game text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{buff.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

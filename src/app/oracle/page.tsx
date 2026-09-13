'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';

type BuffType = 'the_chariot' | 'the_merchant' | 'the_emperor' | 'the_fool' | 'the_magician' | 'the_hermit';

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
    color: 'from-blue-600 to-cyan-400'
  },
  {
    id: 'the_merchant',
    name: 'The Merchant',
    description: '+50% Gold from all quests for 24 hours.',
    icon: '⚖️',
    color: 'from-yellow-600 to-amber-400'
  },
  {
    id: 'the_emperor',
    name: 'The Emperor',
    description: '+25% XP and Gold from all quests for 24 hours.',
    icon: '👑',
    color: 'from-purple-600 to-fuchsia-400'
  },
  {
    id: 'the_fool',
    name: 'The Fool',
    description: '+100% XP for 24 hours, but gold is reduced by 50%.',
    icon: '🃏',
    color: 'from-green-600 to-emerald-400'
  },
  {
    id: 'the_magician',
    name: 'The Magician',
    description: '+50% XP and Gold for Intellect and Creativity quests.',
    icon: '🪄',
    color: 'from-pink-600 to-rose-400'
  },
  {
    id: 'the_hermit',
    name: 'The Hermit',
    description: '-50% Gold but +100% XP for Discipline quests.',
    icon: '🏔️',
    color: 'from-slate-600 to-gray-400'
  }
];

export default function OraclePage() {
  const [activeBuff, setActiveBuff] = useState<Buff | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    // Check if they already drew today
    const storedBuff = localStorage.getItem('oracle_active_buff');
    const drawDate = localStorage.getItem('oracle_draw_date');
    const today = new Date().toDateString();

    if (storedBuff && drawDate === today) {
      const buff = BUFFS.find(b => b.id === storedBuff);
      if (buff) {
        setActiveBuff(buff);
        setIsFlipped(true);
        setCooldown(true);
      }
    } else if (drawDate !== today) {
      // Expire old buff
      localStorage.removeItem('oracle_active_buff');
    }
  }, []);

  const drawCard = () => {
    if (cooldown || drawing) return;
    
    setDrawing(true);
    
    // Pick random buff
    const randomBuff = BUFFS[Math.floor(Math.random() * BUFFS.length)];
    setActiveBuff(randomBuff);
    
    // Save to local storage
    localStorage.setItem('oracle_active_buff', randomBuff.id);
    localStorage.setItem('oracle_draw_date', new Date().toDateString());

    // Trigger flip animation
    setTimeout(() => {
      setIsFlipped(true);
      setDrawing(false);
      setCooldown(true);
      toast.success(`${randomBuff.name} drawn! Buff active for 24 hours.`, { icon: '🔮' });
    }, 1500); // Wait for mysterious shuffle effect
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 relative pt-8">
      <Link 
        href="/dashboard"
        className="absolute top-0 left-0 text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-game group"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> GO BACK
      </Link>

      <div className="text-center">
        <h1 className="font-game text-4xl text-fuchsia-400 glow-purple mb-4">THE DESTINY ORACLE</h1>
        <p className="text-slate-400">Draw a card daily to weave a powerful buff into your fate.</p>
      </div>

      <div className="relative mt-12 bg-black/40 border border-slate-800 rounded-2xl min-h-[500px] flex flex-col items-center justify-center p-8 overflow-hidden">
        
        {/* Mystic Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-black to-black opacity-80" />
        
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute w-1 h-1 rounded-full bg-fuchsia-400"
               style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
               animate={{ y: [0, -20, 0], opacity: [0, 0.8, 0] }}
               transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
             />
          ))}
        </div>

        {/* 3D Card Container */}
        <div 
          className="relative z-10 w-64 h-96 cursor-pointer"
          style={{ perspective: '1000px' }}
          onClick={drawCard}
        >
          <motion.div
            className="w-full h-full relative"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ 
              rotateY: isFlipped ? 180 : 0,
              y: drawing ? [0, -20, 0, -20, 0] : [0, -10, 0] // Shuffle shake vs idle float
            }}
            transition={{ 
              rotateY: { duration: 0.8, ease: "easeInOut" },
              y: drawing ? { duration: 1.5 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Front of Card (Card Back pattern) */}
            <div 
              className="absolute inset-0 w-full h-full rounded-xl border-2 border-fuchsia-900/50 flex items-center justify-center bg-[#0a0118] overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-0 bg-[url('/grid.png')] opacity-30" />
              <div className="absolute inset-1 border border-fuchsia-500/20 rounded-lg m-2 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-fuchsia-500/30 flex items-center justify-center">
                  <span className="text-3xl animate-pulse">👁️</span>
                </div>
              </div>
            </div>

            {/* Back of Card (The Actual Buff) */}
            <div 
              className={`absolute inset-0 w-full h-full rounded-xl border-2 border-white/20 flex flex-col items-center justify-center bg-gradient-to-br ${activeBuff?.color || 'from-slate-800 to-slate-900'} overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {activeBuff && (
                <>
                  <div className="absolute inset-0 bg-[url('/grid.png')] opacity-20" />
                  <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent" />
                  
                  <span className="text-7xl mb-6 relative z-10 drop-shadow-xl">{activeBuff.icon}</span>
                  
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
              <motion.p key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-fuchsia-400 text-sm font-game animate-pulse">
                CLICK THE CARD TO REVEAL YOUR DESTINY
              </motion.p>
            )}
            {drawing && (
              <motion.p key="drawing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate-400 text-sm">
                The spirits are deciding your fate...
              </motion.p>
            )}
            {cooldown && activeBuff && (
              <motion.p key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-emerald-400 text-sm font-game">
                BUFF ACTIVE UNTIL MIDNIGHT
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

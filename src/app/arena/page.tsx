'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useGameStore, Profile } from '@/store/game';
import { CRTOverlay } from '@/components/CRTOverlay';
import { Sidebar } from '@/components/Sidebar';

interface Boss {
  id: string;
  name: string;
  current_hp: number;
  max_hp: number;
  status: 'active' | 'defeated';
  tier: number;
  atk: number;
  def: number;
  signature_move: string | null;
}

export default function ArenaPage() {
  const { lastCombatResult } = useGameStore();
  const [boss, setBoss] = useState<Boss | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(false);

  // Animation triggers
  const [playerShake, setPlayerShake] = useState(false);
  const [bossShake, setBossShake] = useState(false);
  const [critFlash, setCritFlash] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<{ id: number, text: string, type: 'boss' | 'player' | 'crit' | 'heal', x: number }[]>([]);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    async function fetchArenaData() {
      try {
        const res = await fetch('/api/arena');
        if (res.ok) {
          const data = await res.json();
          setBoss(data.boss);
          setProfile(data.profile);
        }
      } catch (err) {
        toast.error('Failed to summon arena data');
      } finally {
        setLoading(false);
      }
    }
    fetchArenaData();
  }, []);

  // Watch lastCombatResult for animations and state updates
  useEffect(() => {
    if (lastCombatResult) {
      if (boss) {
        setBoss((prev) => prev ? { ...prev, current_hp: Math.max(0, prev.current_hp - (lastCombatResult.boss_damage || 0)) } : null);
      }
      if (profile) {
        setProfile((prev) => prev ? { ...prev, current_hp: lastCombatResult.current_hp ?? prev.current_hp, combo_multiplier: lastCombatResult.combo_multiplier ?? prev.combo_multiplier } : null);
      }

      // Trigger animations
      const newDmgNumbers: typeof damageNumbers = [];
      const id = Date.now();

      if (lastCombatResult.is_crit) {
        setCritFlash(true);
        setTimeout(() => setCritFlash(false), 200);
      }

      if (lastCombatResult.boss_damage && lastCombatResult.boss_damage > 0) {
        setBossShake(true);
        setTimeout(() => setBossShake(false), 500);
        newDmgNumbers.push({
          id: id + 1,
          text: `-${lastCombatResult.boss_damage}`,
          type: lastCombatResult.is_crit ? 'crit' : 'boss',
          x: Math.random() * 100 - 50
        });
      }

      if (lastCombatResult.counter_damage) {
        if (lastCombatResult.counter_damage > 0) {
          setPlayerShake(true);
          setTimeout(() => setPlayerShake(false), 500);
          newDmgNumbers.push({
            id: id + 2,
            text: `-${lastCombatResult.counter_damage}`,
            type: 'player',
            x: Math.random() * 100 - 50
          });
        } else if (lastCombatResult.counter_damage < 0) {
          // Negative counter_damage means heal!
          newDmgNumbers.push({
            id: id + 2,
            text: `+${Math.abs(lastCombatResult.counter_damage)}`,
            type: 'heal',
            x: Math.random() * 100 - 50
          });
        }
      }

      setDamageNumbers((prev) => [...prev, ...newDmgNumbers]);
      setTimeout(() => {
        setDamageNumbers((prev) => prev.filter(d => d.id !== id + 1 && d.id !== id + 2));
      }, 1500);
    }
  }, [lastCombatResult]);

  if (loading) {
    return (
      <>
        <CRTOverlay enabled={crtEnabled} />
        <Sidebar />
        <main className="pb-20 md:pb-0 md:pl-64 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  const isDefeated = boss?.status === 'defeated' || (boss && boss.current_hp <= 0);
  const isKnockedOut = profile && profile.current_hp <= 0;

  const bossHpPercent = boss ? Math.max(0, (boss.current_hp / boss.max_hp) * 100) : 0;
  const playerHpPercent = profile ? Math.max(0, (profile.current_hp / (profile.max_hp || 100)) * 100) : 0;

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />

      <main className="pb-20 md:pb-0 md:pl-64 min-h-screen">
        
        {/* CRIT FLASH OVERLAY */}
        <AnimatePresence>
          {critFlash && (
            <motion.div 
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-yellow-400 z-50 pointer-events-none mix-blend-overlay"
            />
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-game text-4xl text-purple-400 glow-purple mb-2">THE ARENA</h1>
            <p className="text-slate-400 text-sm">Face the Weekly Nemesis. Complete quests to strike.</p>
          </div>

          {/* KNOCKOUT STATE */}
          {isKnockedOut && (
            <div className="glass-card border-red-500/50 bg-red-900/20 p-8 rounded-xl text-center mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />
              <h2 className="font-game text-4xl text-red-500 mb-2 tracking-widest">KNOCKED OUT</h2>
              <p className="text-red-200">Your health has reached 0. You must rest to recover before fighting again.</p>
            </div>
          )}

          {!boss && !isKnockedOut && (
            <div className="glass-card p-12 text-center rounded-xl">
              <h2 className="font-game text-xl text-slate-400">NO ACTIVE THREATS</h2>
              <p className="text-slate-500 mt-2">The arena is quiet... for now.</p>
            </div>
          )}

          {boss && (
            <div className={`relative bg-black/60 border ${isKnockedOut ? 'border-red-900/50' : 'border-slate-800'} rounded-2xl overflow-hidden min-h-[500px] p-6 lg:p-12`}>
              {/* Background FX */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-black to-black opacity-60 pointer-events-none" />
              
              {/* Damage Numbers Overlay */}
              <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                <AnimatePresence>
                  {damageNumbers.map(dmg => (
                    <motion.div
                      key={dmg.id}
                      initial={{ opacity: 0, y: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], y: -100, scale: dmg.type === 'crit' ? 1.5 : 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={`absolute font-game text-4xl ${
                        dmg.type === 'player' ? 'text-red-500 left-1/4' : 
                        dmg.type === 'heal' ? 'text-green-400 left-1/4' : 
                        'text-yellow-400 right-1/4'
                      } top-1/2 -translate-y-1/2`}
                      style={{ x: dmg.x, textShadow: '2px 2px 0 #000' }}
                    >
                      {dmg.type === 'crit' && <div className="text-sm text-yellow-200 mb-1">CRITICAL!</div>}
                      {dmg.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-12">
                
                {/* --- PLAYER SIDE (LEFT) --- */}
                <div className="w-full md:w-5/12 flex flex-col items-center">
                  <div className="w-full mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <h2 className="font-game text-xl text-blue-400">{profile?.username || 'Hero'}</h2>
                      <span className="font-mono text-sm text-slate-400">{profile?.current_hp || 0} / {profile?.max_hp || 100} HP</span>
                    </div>
                    <div className="w-full h-6 bg-slate-900 rounded-sm border-2 border-slate-700 p-0.5 relative overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-500 rounded-sm"
                        initial={{ width: `${playerHpPercent}%` }}
                        animate={{ width: `${playerHpPercent}%` }}
                        transition={{ duration: 0.5, type: "spring" }}
                      />
                      <div className="absolute inset-0 bg-[url('/grid.png')] opacity-20 pointer-events-none" />
                    </div>
                  </div>

                  <motion.div
                    animate={playerShake ? { x: [-10, 10, -10, 10, 0], filter: ['brightness(1) hue-rotate(0deg)', 'brightness(2) hue-rotate(-50deg)', 'brightness(1) hue-rotate(0deg)'] } : {}}
                    transition={{ duration: 0.4 }}
                    className="relative"
                  >
                    <div className="w-48 h-48 bg-slate-800 mask-image-monster flex items-center justify-center opacity-80"
                      style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)', boxShadow: 'inset 0 0 50px rgba(59,130,246,0.2)' }}
                    >
                      <div className="text-6xl" aria-hidden="true">🛡️</div>
                    </div>
                  </motion.div>

                  {/* Player Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full mt-6 text-center">
                    <div className="bg-black/40 border border-slate-800 rounded p-2">
                      <div className="text-xs text-slate-500">DEFENSE</div>
                      <div className="font-game text-blue-400">{profile?.defense || 0}</div>
                    </div>
                    <div className="bg-black/40 border border-slate-800 rounded p-2">
                      <div className="text-xs text-slate-500">CRIT RATE</div>
                      <div className="font-game text-yellow-400">{profile?.crit_chance || 5}%</div>
                    </div>
                    <div className="col-span-2 bg-black/40 border border-slate-800 rounded p-2">
                      <div className="text-xs text-slate-500">COMBO MULTIPLIER</div>
                      <div className="font-game text-emerald-400">x{profile?.combo_multiplier || 1.0}</div>
                    </div>
                  </div>
                </div>


                {/* --- VS TEXT --- */}
                <div className="font-game text-4xl text-slate-700 hidden md:block">VS</div>


                {/* --- BOSS SIDE (RIGHT) --- */}
                <div className="w-full md:w-5/12 flex flex-col items-center">
                  <div className="w-full mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <h2 className="font-game text-xl text-purple-400">{boss.name}</h2>
                      <span className="font-mono text-sm text-slate-400">{boss.current_hp} / {boss.max_hp} HP</span>
                    </div>
                    <div className="w-full h-6 bg-slate-900 rounded-sm border-2 border-slate-700 p-0.5 relative overflow-hidden">
                      <motion.div 
                        className={`h-full ${isDefeated ? 'bg-slate-700' : 'bg-red-500'} rounded-sm`}
                        initial={{ width: `${bossHpPercent}%` }}
                        animate={{ width: `${bossHpPercent}%` }}
                        transition={{ duration: 0.5, type: "spring" }}
                      />
                      <div className="absolute inset-0 bg-[url('/grid.png')] opacity-20 pointer-events-none" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {!isDefeated ? (
                      <motion.div
                        key="boss-active"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={bossShake 
                          ? { x: [-15, 15, -15, 15, 0], filter: ['brightness(1) hue-rotate(0deg)', 'brightness(3) hue-rotate(50deg)', 'brightness(1) hue-rotate(0deg)'] }
                          : { opacity: 1, scale: 1, y: [0, -10, 0] }
                        }
                        transition={bossShake ? { duration: 0.4 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                      >
                        {/* Scary Eyes */}
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-24 flex justify-between px-4 z-20">
                          <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse" />
                          <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse" />
                        </div>
                        
                        {/* Silhouette */}
                        <div 
                          className="w-48 h-48 bg-slate-900 mask-image-monster relative z-10"
                          style={{
                            clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
                            boxShadow: 'inset 0 0 50px rgba(168,85,247,0.2)'
                          }}
                        >
                          <div className="w-full h-full border-4 border-slate-800 opacity-50" 
                            style={{ clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)' }} />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="boss-defeated"
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: 0, scale: 0, rotate: 180 }}
                        transition={{ duration: 1.5 }}
                        className="w-48 h-48 bg-red-900 rounded-full blur-xl flex items-center justify-center text-5xl font-game text-yellow-400"
                      >
                        SLAIN
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Boss Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full mt-6 text-center">
                    <div className="bg-black/40 border border-slate-800 rounded p-2">
                      <div className="text-xs text-slate-500">ATTACK</div>
                      <div className="font-game text-red-400">{boss.atk || '?'}</div>
                    </div>
                    <div className="bg-black/40 border border-slate-800 rounded p-2">
                      <div className="text-xs text-slate-500">DEFENSE</div>
                      <div className="font-game text-slate-400">{boss.def || '?'}</div>
                    </div>
                    {boss.signature_move && (
                      <div className="col-span-2 bg-black/40 border border-slate-800 rounded p-2">
                        <div className="text-xs text-slate-500">SIGNATURE MOVE</div>
                        <div className="font-game text-purple-400 text-xs">{boss.signature_move}</div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-6 text-center mt-8 max-w-2xl mx-auto">
            <h3 className="font-game text-sm text-purple-400 mb-2">TACTICAL OVERVIEW</h3>
            <p className="text-slate-400 text-sm">
              Your quests deal damage based on XP earned vs Boss Defense. The boss counter-attacks against your Defense. 
              Maintain your Combo Multiplier by completing quests within 30 minutes to deal devastating blows!
            </p>
          </div>

        </div>
      </main>
    </>
  );
}

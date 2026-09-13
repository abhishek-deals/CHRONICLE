'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CRTOverlay } from '@/components/CRTOverlay';
import { Sidebar } from '@/components/Sidebar';
import { useGameStore } from '@/store/game';

interface PathDecision {
  title: string;
  description: string;
  projected_xp: number;
  projected_hp_change: number;
  difficulty: string;
}

interface Crossroads {
  scenario: string;
  pathA: PathDecision;
  pathB: PathDecision;
}

export default function ArenaPage() {
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [crossroads, setCrossroads] = useState<Crossroads | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyDecided, setAlreadyDecided] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<'A' | 'B' | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const profile = useGameStore((s) => s.profile);
  const fetchProfile = useGameStore((s) => s.fetchProfile);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    fetchProfile();
    fetchOptions();
  }, [fetchProfile]);

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/decision-options');
      const data = await res.json();
      
      if (data.alreadyDecided) {
        setAlreadyDecided(true);
      } else if (data.decision) {
        setCrossroads(data.decision);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to fetch the daily crossroads.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async (path: PathDecision, pathId: 'A' | 'B') => {
    setIsCommitting(true);
    setHoveredPath(pathId); // Lock the hover effect
    
    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(path),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Choice locked! ${data.xp_gained} XP awarded.`, { icon: '⚡' });
        if (data.level_up) {
          toast.success(`LEVEL UP! You are now Level ${data.new_level}`, { icon: '⭐' });
        }
        await fetchProfile(); // Refresh profile state in game store
        setTimeout(() => {
          setAlreadyDecided(true);
        }, 1500);
      } else {
        toast.error(data.error || 'Failed to commit decision.');
        setIsCommitting(false);
      }
    } catch (err) {
      toast.error('Network error.');
      setIsCommitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <CRTOverlay enabled={crtEnabled} />
        <Sidebar />
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'url(/doom-bg-2.jpg)', backgroundSize: 'cover' }} />
        <main className="pb-20 md:pb-0 md:pl-64 min-h-screen flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-game text-purple-400">THE ORACLE IS PONDERING YOUR FATE...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />
      
      {/* Dynamic Background based on hover */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none transition-colors duration-1000"
        animate={{
          backgroundColor: hoveredPath === 'A' ? 'rgba(59, 130, 246, 0.15)' : hoveredPath === 'B' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(5, 2, 17, 1)',
        }}
        style={{
          backgroundImage: 'url(/doom-bg-2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
      </motion.div>

      <main className="pb-20 md:pb-0 md:pl-64 min-h-screen relative z-10 flex flex-col justify-center py-8">
        <div className="max-w-6xl mx-auto px-4 w-full">
          
          <div className="text-center mb-12">
            <h1 className="font-game text-4xl text-white glow-purple mb-4">THE DECISION ARENA</h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
              {alreadyDecided 
                ? "Your fate for today is sealed. Return tomorrow." 
                : "Every day presents a crossroads. The path you choose defines who you become."}
            </p>
          </div>

          {alreadyDecided ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card pixel-border p-12 text-center max-w-2xl mx-auto"
            >
              <div className="text-6xl mb-6" aria-hidden="true">⚔️</div>
              <h2 className="font-game text-2xl text-purple-400 mb-4">DECISION MADE</h2>
              <p className="text-slate-400">
                You have faced the crossroads and made your choice. The universe is now in motion.
                Return tomorrow for your next trial.
              </p>
            </motion.div>
          ) : crossroads ? (
            <div className="relative">
              
              {/* Context Scenario */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10 p-6 bg-black/40 border border-slate-800 rounded-lg max-w-3xl mx-auto"
              >
                <p className="text-slate-300 italic text-lg leading-relaxed">"{crossroads.scenario}"</p>
              </motion.div>

              <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center relative">
                
                {/* VS Glowing Divider */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center pointer-events-none">
                  <div className="w-px h-32 bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
                  <div className="bg-black border border-purple-500 rounded-full w-12 h-12 flex items-center justify-center font-game text-purple-400 glow-purple z-10 shadow-[0_0_20px_#a855f7]">
                    VS
                  </div>
                  <div className="w-px h-32 bg-gradient-to-t from-transparent via-purple-500 to-transparent" />
                </div>

                {/* PATH A (Hard) */}
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={!isCommitting ? { scale: 1.02 } : {}}
                  onHoverStart={() => !isCommitting && setHoveredPath('A')}
                  onHoverEnd={() => !isCommitting && setHoveredPath(null)}
                  className={`flex-1 glass-card border-2 transition-all duration-300 rounded-xl overflow-hidden ${
                    hoveredPath === 'A' ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-slate-800 opacity-70 hover:opacity-100'
                  } ${hoveredPath === 'B' ? 'opacity-30 blur-sm' : ''}`}
                >
                  <div className="bg-gradient-to-b from-blue-900/40 to-transparent p-8 h-full flex flex-col">
                    <div className="text-blue-400 font-game text-xs mb-2 tracking-widest uppercase">Path of Resistance</div>
                    <h2 className="font-game text-2xl text-white mb-4">{crossroads.pathA.title}</h2>
                    <p className="text-slate-300 text-sm mb-8 flex-1">{crossroads.pathA.description}</p>
                    
                    <div className="bg-black/50 rounded-lg p-4 mb-6 border border-slate-700">
                      <h3 className="font-game text-xs text-slate-500 mb-3 text-center">PROJECTED OUTCOME</h3>
                      <div className="flex justify-around text-center">
                        <div>
                          <div className="text-xs text-slate-500">XP GAIN</div>
                          <div className="font-game text-blue-400 text-xl">+{crossroads.pathA.projected_xp}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">HP CHANGE</div>
                          <div className={`font-game text-xl ${crossroads.pathA.projected_hp_change < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {crossroads.pathA.projected_hp_change > 0 ? '+' : ''}{crossroads.pathA.projected_hp_change}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      disabled={isCommitting}
                      onClick={() => handleCommit(crossroads.pathA, 'A')}
                      className={`w-full py-4 rounded font-game transition-all ${
                        hoveredPath === 'A' ? 'bg-blue-600 text-white shadow-[0_0_15px_#2563eb]' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCommitting && hoveredPath === 'A' ? 'SEALING FATE...' : 'EMBRACE THE STRUGGLE'}
                    </button>
                  </div>
                </motion.div>

                {/* PATH B (Easy) */}
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={!isCommitting ? { scale: 1.02 } : {}}
                  onHoverStart={() => !isCommitting && setHoveredPath('B')}
                  onHoverEnd={() => !isCommitting && setHoveredPath(null)}
                  className={`flex-1 glass-card border-2 transition-all duration-300 rounded-xl overflow-hidden ${
                    hoveredPath === 'B' ? 'border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'border-slate-800 opacity-70 hover:opacity-100'
                  } ${hoveredPath === 'A' ? 'opacity-30 blur-sm' : ''}`}
                >
                  <div className="bg-gradient-to-b from-red-900/20 to-transparent p-8 h-full flex flex-col">
                    <div className="text-red-400 font-game text-xs mb-2 tracking-widest uppercase">Path of Comfort</div>
                    <h2 className="font-game text-2xl text-white mb-4">{crossroads.pathB.title}</h2>
                    <p className="text-slate-300 text-sm mb-8 flex-1">{crossroads.pathB.description}</p>
                    
                    <div className="bg-black/50 rounded-lg p-4 mb-6 border border-slate-700">
                      <h3 className="font-game text-xs text-slate-500 mb-3 text-center">PROJECTED OUTCOME</h3>
                      <div className="flex justify-around text-center">
                        <div>
                          <div className="text-xs text-slate-500">XP GAIN</div>
                          <div className="font-game text-slate-400 text-xl">+{crossroads.pathB.projected_xp}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">HP CHANGE</div>
                          <div className={`font-game text-xl ${crossroads.pathB.projected_hp_change < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {crossroads.pathB.projected_hp_change > 0 ? '+' : ''}{crossroads.pathB.projected_hp_change}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      disabled={isCommitting}
                      onClick={() => handleCommit(crossroads.pathB, 'B')}
                      className={`w-full py-4 rounded font-game transition-all ${
                        hoveredPath === 'B' ? 'bg-red-900 text-red-200 border border-red-500 shadow-[0_0_15px_#991b1b]' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCommitting && hoveredPath === 'B' ? 'SEALING FATE...' : 'SUCCUMB TO COMFORT'}
                    </button>
                  </div>
                </motion.div>

              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card pixel-border p-12 text-center max-w-2xl mx-auto border-red-500/50"
            >
              <div className="text-6xl mb-6" aria-hidden="true">⚠️</div>
              <h2 className="font-game text-2xl text-red-400 mb-4">THE ORACLE IS SILENT</h2>
              <p className="text-slate-400 mb-6">
                The cosmic threads are tangled. The AI failed to generate a decision path.
              </p>
              <button 
                onClick={() => { setLoading(true); fetchOptions(); }}
                className="btn-primary py-2 px-6 font-game text-sm"
              >
                TRY AGAIN
              </button>
            </motion.div>
          )}

        </div>
      </main>
    </>
  );
}

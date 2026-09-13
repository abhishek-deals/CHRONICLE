'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { toast } from 'sonner';

interface ProjectionData {
  xp: number;
  level: number;
  attributes: { strength: number; intellect: number; discipline: number; creativity: number };
  streak: number;
}

interface ProjectionResponse {
  current: ProjectionData;
  projected: ProjectionData;
}

export default function FutureSelfPortal() {
  const [crtEnabled, setCrtEnabled] = useState(false);
  
  const [days, setDays] = useState<number>(30);
  const [pathA, setPathA] = useState({ questsPerDay: 2, activeDays: 3 });
  const [pathB, setPathB] = useState({ questsPerDay: 5, activeDays: 6 });
  
  const [currentStats, setCurrentStats] = useState<ProjectionData | null>(null);
  const [projA, setProjA] = useState<ProjectionData | null>(null);
  const [projB, setProjB] = useState<ProjectionData | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [portalActive, setPortalActive] = useState(false);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
  }, []);

  const fetchProjection = async (questsPerDay: number, activeDays: number, daysToProject: number): Promise<ProjectionResponse | null> => {
    try {
      const res = await fetch('/api/future-projection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questsPerDay, activeDays, daysToProject })
      });
      if (!res.ok) throw new Error('Failed to fetch projection');
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleSimulate = async () => {
    setIsLoading(true);
    // portal activation sequence
    setPortalActive(true);
    
    try {
      const [resA, resB] = await Promise.all([
        fetchProjection(pathA.questsPerDay, pathA.activeDays, days),
        fetchProjection(pathB.questsPerDay, pathB.activeDays, days)
      ]);
      
      if (resA && resB) {
        setCurrentStats(resA.current);
        setProjA(resA.projected);
        setProjB(resB.projected);
      } else {
        toast.error('Failed to look into the future.');
      }
    } finally {
      // Small delay for the animation effect
      setTimeout(() => setIsLoading(false), 1500);
    }
  };
  
  const handleReset = () => {
    setPortalActive(false);
    setCurrentStats(null);
    setProjA(null);
    setProjB(null);
  };

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />
      
      {/* Portal Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        <AnimatePresence>
          {portalActive && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-[800px] h-[800px] rounded-full" 
                   style={{ 
                     background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(15,23,42,0) 70%)',
                     boxShadow: '0 0 100px rgba(56,189,248,0.2) inset' 
                   }} 
              />
              <div className="absolute w-[600px] h-[600px] rounded-full border border-sky-500/20 animate-spin-slow" />
              <div className="absolute w-[400px] h-[400px] rounded-full border border-purple-500/30 animate-spin-reverse-slow" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-black to-black" />
      </div>

      <main className="pb-24 md:pb-0 md:pl-64 min-h-screen relative z-10 flex flex-col">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 w-full flex-1 flex flex-col">
          
          <div className="text-center mb-12">
            <h1 className="font-game text-3xl text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-500 mb-2" style={{ textShadow: '0 0 30px rgba(168,85,247,0.4)' }}>
              FUTURE SELF PORTAL
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Your actions today create your world tomorrow. Adjust your consistency to project your future RPG progression.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!portalActive ? (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto w-full space-y-8"
              >
                {/* Time Selection */}
                <div className="glass-card pixel-border p-6 rounded-xl text-center">
                  <h2 className="font-game text-sm text-sky-300 mb-4">HOW FAR DO YOU WANT TO LOOK?</h2>
                  <div className="flex flex-wrap justify-center gap-3">
                    {[30, 90, 180, 365].map(d => (
                      <button 
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-6 py-3 rounded-lg font-game text-sm transition-all duration-300 ${days === d ? 'bg-sky-900/60 border border-sky-400 text-sky-100 shadow-[0_0_15px_rgba(56,189,248,0.5)]' : 'bg-slate-800/40 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                      >
                        {d} DAYS
                      </button>
                    ))}
                  </div>
                </div>

                {/* Path Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Path A */}
                  <div className="glass-card pixel-border p-6 rounded-xl border-l-4 border-l-slate-500">
                    <h3 className="font-game text-slate-300 mb-6 flex justify-between items-center">
                      <span>PATH A</span>
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded">BASELINE</span>
                    </h3>
                    
                    <div className="space-y-6">
                      <Slider 
                        label="QUESTS PER DAY" 
                        value={pathA.questsPerDay} 
                        setter={(v) => setPathA({...pathA, questsPerDay: v})} 
                        max={10} 
                        color="from-slate-600 to-slate-400" 
                      />
                      <Slider 
                        label="ACTIVE DAYS / WEEK" 
                        value={pathA.activeDays} 
                        setter={(v) => setPathA({...pathA, activeDays: v})} 
                        max={7} 
                        color="from-slate-600 to-slate-400" 
                      />
                    </div>
                  </div>

                  {/* Path B */}
                  <div className="glass-card pixel-border p-6 rounded-xl border-l-4 border-l-purple-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                    <h3 className="font-game text-purple-300 mb-6 flex justify-between items-center relative z-10">
                      <span>PATH B</span>
                      <span className="text-xs bg-purple-900/50 text-purple-200 px-2 py-1 rounded border border-purple-500/30">AMBITIOUS</span>
                    </h3>
                    
                    <div className="space-y-6 relative z-10">
                      <Slider 
                        label="QUESTS PER DAY" 
                        value={pathB.questsPerDay} 
                        setter={(v) => setPathB({...pathB, questsPerDay: v})} 
                        max={10} 
                        color="from-purple-900 to-purple-500" 
                      />
                      <Slider 
                        label="ACTIVE DAYS / WEEK" 
                        value={pathB.activeDays} 
                        setter={(v) => setPathB({...pathB, activeDays: v})} 
                        max={7} 
                        color="from-purple-900 to-purple-500" 
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button 
                    onClick={handleSimulate}
                    className="btn-primary px-12 py-4 text-lg"
                  >
                    OPEN PORTAL
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="w-full"
              >
                {isLoading || !currentStats || !projA || !projB ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-16 h-16 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
                    <p className="font-game text-sky-400 animate-pulse">CALCULATING TIMELINES...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="text-center mb-8">
                      <h2 className="font-game text-xl text-sky-100">{days}-DAY PROJECTION</h2>
                      <p className="text-slate-400 text-xs mt-1">Based on your selected activity pattern.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      
                      {/* Current Self */}
                      <div className="glass-card p-6 rounded-xl flex flex-col items-center border border-slate-700/50">
                        <div className="text-xs text-slate-500 font-game mb-6 uppercase">Current Self</div>
                        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center mb-4">
                           <span className="text-4xl">🧍</span>
                        </div>
                        <h3 className="font-game text-lg text-slate-200 mb-1">LEVEL {currentStats.level}</h3>
                        <p className="text-xs text-slate-400 mb-6">{currentStats.xp.toLocaleString()} XP</p>
                        
                        <div className="w-full space-y-3 text-sm">
                          <StatRow label="INTELLECT" val={currentStats.attributes.intellect} />
                          <StatRow label="STRENGTH" val={currentStats.attributes.strength} />
                          <StatRow label="DISCIPLINE" val={currentStats.attributes.discipline} />
                          <StatRow label="CREATIVITY" val={currentStats.attributes.creativity} />
                          <StatRow label="STREAK" val={currentStats.streak} />
                        </div>
                      </div>

                      {/* Path A Projected */}
                      <div className="glass-card p-6 rounded-xl flex flex-col items-center border border-slate-500/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-500/5 transition-colors group-hover:bg-slate-500/10" />
                        <div className="relative z-10 w-full flex flex-col items-center">
                          <div className="text-xs text-slate-400 font-game mb-2 uppercase">PATH A (Baseline)</div>
                          <div className="text-[10px] text-slate-500 mb-4">{pathA.questsPerDay} quests/day • {pathA.activeDays} days/wk</div>
                          
                          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(100,116,139,0.3)]">
                             <span className="text-4xl">🚶</span>
                          </div>
                          <h3 className="font-game text-lg text-slate-100 mb-1">
                            LEVEL <AnimatedNumber value={projA.level} />
                          </h3>
                          <p className="text-xs text-slate-400 mb-6"><AnimatedNumber value={projA.xp} /> XP</p>
                          
                          <div className="w-full space-y-3 text-sm">
                            <StatRow label="INTELLECT" val={projA.attributes.intellect} diff={projA.attributes.intellect - currentStats.attributes.intellect} />
                            <StatRow label="STRENGTH" val={projA.attributes.strength} diff={projA.attributes.strength - currentStats.attributes.strength} />
                            <StatRow label="DISCIPLINE" val={projA.attributes.discipline} diff={projA.attributes.discipline - currentStats.attributes.discipline} />
                            <StatRow label="CREATIVITY" val={projA.attributes.creativity} diff={projA.attributes.creativity - currentStats.attributes.creativity} />
                            <StatRow label="STREAK" val={projA.streak} diff={projA.streak - currentStats.streak} />
                          </div>
                        </div>
                      </div>

                      {/* Path B Projected */}
                      <div className="glass-card p-6 rounded-xl flex flex-col items-center border border-purple-500/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-purple-500/10 transition-colors group-hover:bg-purple-500/20" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                        
                        <div className="relative z-10 w-full flex flex-col items-center">
                          <div className="text-xs text-purple-300 font-game mb-2 uppercase">PATH B (Ambitious)</div>
                          <div className="text-[10px] text-purple-400/70 mb-4">{pathB.questsPerDay} quests/day • {pathB.activeDays} days/wk</div>
                          
                          <div className="w-24 h-24 rounded-full bg-purple-900/50 border-2 border-purple-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                             <span className="text-4xl">🦸</span>
                          </div>
                          <h3 className="font-game text-xl text-purple-100 mb-1" style={{ textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
                            LEVEL <AnimatedNumber value={projB.level} />
                          </h3>
                          <p className="text-xs text-purple-300 mb-6"><AnimatedNumber value={projB.xp} /> XP</p>
                          
                          <div className="w-full space-y-3 text-sm font-medium">
                            <StatRow label="INTELLECT" val={projB.attributes.intellect} diff={projB.attributes.intellect - currentStats.attributes.intellect} color="text-purple-200" />
                            <StatRow label="STRENGTH" val={projB.attributes.strength} diff={projB.attributes.strength - currentStats.attributes.strength} color="text-purple-200" />
                            <StatRow label="DISCIPLINE" val={projB.attributes.discipline} diff={projB.attributes.discipline - currentStats.attributes.discipline} color="text-purple-200" />
                            <StatRow label="CREATIVITY" val={projB.attributes.creativity} diff={projB.attributes.creativity - currentStats.attributes.creativity} color="text-purple-200" />
                            <StatRow label="STREAK" val={projB.streak} diff={projB.streak - currentStats.streak} color="text-purple-200" />
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="text-center pt-8">
                       <button onClick={handleReset} className="text-xs font-game text-slate-500 hover:text-slate-300 transition-colors">
                         ← RESET SIMULATION
                       </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </>
  );
}

function Slider({ label, value, setter, max, color }: { label: string, value: number, setter: (v: number) => void, max: number, color: string }) {
  const percentage = (value / max) * 100;
  
  return (
    <div>
      <div className="flex justify-between text-xs font-game text-slate-300 mb-2">
        <span>{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="relative h-2 bg-slate-800 rounded-lg">
        <div 
          className={`absolute top-0 left-0 h-full rounded-lg bg-gradient-to-r ${color}`} 
          style={{ width: `${percentage}%` }}
        />
        <input 
          type="range" 
          min="1" max={max} 
          value={value} 
          onChange={(e) => setter(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function StatRow({ label, val, diff, color = "text-slate-300" }: { label: string, val: number, diff?: number, color?: string }) {
  return (
    <div className="flex justify-between items-center border-b border-slate-700/30 pb-1">
      <span className="text-slate-500 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className={color}>{val.toLocaleString()}</span>
        {diff !== undefined && diff > 0 && (
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-1 rounded">+{diff.toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

// Simple animated counter for numbers
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

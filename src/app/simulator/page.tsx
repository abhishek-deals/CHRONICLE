'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';

export default function SimulatorPage() {
  const [crtEnabled, setCrtEnabled] = useState(false);
  
  // Sliders for attributes
  const [str, setStr] = useState(10);
  const [int, setInt] = useState(10);
  const [cre, setCre] = useState(10);
  const [dis, setDis] = useState(10);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
  }, []);

  // Determine avatar "class" based on highest stat
  let dominantClass = 'Novice';
  const maxStat = Math.max(str, int, cre, dis);
  if (maxStat > 20) {
    if (str === maxStat) dominantClass = 'Warrior';
    else if (int === maxStat) dominantClass = 'Mage';
    else if (cre === maxStat) dominantClass = 'Bard';
    else if (dis === maxStat) dominantClass = 'Monk';
  }

  // Generate a random-looking but deterministic avatar based on stats
  const avatarHue = (int * 3 + cre * 5 + dis * 2) % 360;
  const avatarScale = 1 + (str / 200);

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />

      <main className="pb-24 md:pb-0 md:pl-64 min-h-screen" style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #050211 60%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          
          <div className="mb-8">
            <h1 className="font-game text-2xl text-white glow-purple">LIVING AVATAR SIMULATOR</h1>
            <p className="text-slate-400 text-sm mt-1">Project how your attributes shape your destiny</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Controls */}
            <div className="glass-card pixel-border p-6 rounded-xl space-y-6">
              <h2 className="font-game text-lg text-purple-300 mb-4 border-b border-purple-900/30 pb-2">ATTRIBUTES</h2>
              
              <Slider label="STRENGTH (STR)" value={str} setter={setStr} color="bg-red-500" />
              <Slider label="INTELLECT (INT)" value={int} setter={setInt} color="bg-blue-500" />
              <Slider label="CREATIVITY (CRE)" value={cre} setter={setCre} color="bg-yellow-500" />
              <Slider label="DISCIPLINE (DIS)" value={dis} setter={setDis} color="bg-emerald-500" />
              
              <div className="pt-4 border-t border-purple-900/30">
                <button 
                  onClick={() => { setStr(10); setInt(10); setCre(10); setDis(10); }}
                  className="w-full btn-secondary text-xs py-2"
                >
                  RESET SIMULATION
                </button>
              </div>
            </div>

            {/* Avatar Preview */}
            <div className="glass-card pixel-border p-6 rounded-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-900/10 grid-bg opacity-30" />
              
              <div 
                className="relative z-10 w-40 h-40 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all duration-500"
                style={{ 
                  borderColor: `hsl(${avatarHue}, 80%, 60%)`,
                  backgroundColor: `hsl(${avatarHue}, 30%, 15%)`,
                  transform: `scale(${avatarScale})`,
                  boxShadow: `0 0 30px hsl(${avatarHue}, 80%, 40%, 0.4)`
                }}
              >
                <span className="text-6xl filter drop-shadow-lg" aria-hidden="true">
                  {dominantClass === 'Warrior' ? '⚔️' :
                   dominantClass === 'Mage' ? '🔮' :
                   dominantClass === 'Bard' ? '🎨' :
                   dominantClass === 'Monk' ? '👁️' : '🧍'}
                </span>
              </div>
              
              <div className="relative z-10 mt-8 text-center">
                <h3 className="font-game text-2xl text-white tracking-widest uppercase mb-1" style={{ color: `hsl(${avatarHue}, 80%, 70%)` }}>
                  {dominantClass}
                </h3>
                <p className="text-slate-400 text-sm">
                  Total Level: {Math.floor((str + int + cre + dis) / 4)}
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>
    </>
  );
}

function Slider({ label, value, setter, color }: { label: string, value: number, setter: (v: number) => void, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-game text-slate-300 mb-2">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input 
        type="range" 
        min="1" max="100" 
        value={value} 
        onChange={(e) => setter(Number(e.target.value))}
        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--tw-gradient-stops))`,
        }}
      />
    </div>
  );
}

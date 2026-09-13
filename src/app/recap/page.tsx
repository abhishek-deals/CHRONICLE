'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';

interface WeeklyStats {
  questsCompleted: number;
  xpGained: number;
  goldGained: number;
  bossesDefeated: number;
  bossesNames: string[];
}

interface Profile {
  username: string;
  level: number;
}

interface Attributes {
  intellect: number;
  strength: number;
  discipline: number;
  creativity: number;
}

export default function RecapPage() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attributes, setAttributes] = useState<Attributes | null>(null);
  const [loading, setLoading] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const scorecardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    async function fetchRecap() {
      try {
        const res = await fetch('/api/recap');
        if (res.ok) {
          const data = await res.json();
          setStats(data.weeklyStats);
          setProfile(data.profile);
          setAttributes(data.attributes);
        }
      } catch (err) {
        toast.error('Failed to load recap');
      } finally {
        setLoading(false);
      }
    }
    fetchRecap();
  }, []);

  const handleExport = async () => {
    if (!scorecardRef.current || isExporting) return;
    setIsExporting(true);
    toast.info('Forging scorecard image...');

    try {
      // Temporarily disable any CSS transforms that mess with html2canvas
      const canvas = await html2canvas(scorecardRef.current, {
        backgroundColor: '#050211',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `chronicle-recap-${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      toast.success('Scorecard saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate image');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats || !profile || !attributes) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-game text-xl text-slate-400">THE CHRONICLE IS EMPTY</h2>
        <p className="text-slate-500 mt-2">No heroic deeds were recorded this week.</p>
      </div>
    );
  }

  // Determine highest attribute
  const attrEntries = Object.entries(attributes).filter(([k]) => k !== 'id' && k !== 'user_id');
  const topAttr = attrEntries.sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />

      <main className="pb-20 md:pb-0 md:pl-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center">
          
          <div className="text-center mb-8">
            <h1 className="font-game text-3xl text-yellow-400 glow-yellow mb-2">THE CHRONICLE&apos;S END</h1>
            <p className="text-slate-400 text-sm">Your weekly saga, inscribed in the annals of history.</p>
          </div>

          {/* SCORECARD TO BE EXPORTED */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-[#0a0f1a] border-4 border-slate-700 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] relative"
            ref={scorecardRef}
          >
            {/* Background design */}
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-yellow-500" />
            
            <div className="p-8 md:p-12 relative z-10">
              {/* Header */}
              <div className="text-center mb-10 pb-10 border-b border-slate-800/60">
                <div className="text-6xl mb-4" aria-hidden="true">📜</div>
                <h2 className="font-game text-4xl text-white tracking-widest mb-2">{profile.username}</h2>
                <p className="font-game text-xl text-blue-400">Level {profile.level} Adventurer</p>
                <p className="text-slate-500 text-sm mt-2 font-mono uppercase tracking-widest">Weekly Recap</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-10">
                <div>
                  <div className="text-3xl mb-2" aria-hidden="true">🎯</div>
                  <div className="font-game text-3xl text-white mb-1">{stats.questsCompleted}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Quests</div>
                </div>
                <div>
                  <div className="text-3xl mb-2" aria-hidden="true">✨</div>
                  <div className="font-game text-3xl text-emerald-400 mb-1">+{stats.xpGained}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">XP Gained</div>
                </div>
                <div>
                  <div className="text-3xl mb-2" aria-hidden="true">🪙</div>
                  <div className="font-game text-3xl text-yellow-400 mb-1">+{stats.goldGained}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Gold Gained</div>
                </div>
                <div>
                  <div className="text-3xl mb-2" aria-hidden="true">👹</div>
                  <div className="font-game text-3xl text-red-400 mb-1">{stats.bossesDefeated}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Bosses Slain</div>
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-black/40 rounded-xl p-6 border border-slate-800">
                <h3 className="font-game text-sm text-slate-400 mb-4 text-center">NOTABLE ACHIEVEMENTS</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4">
                    <span className="text-2xl" aria-hidden="true">🏆</span>
                    <div>
                      <p className="text-white font-medium">Paragon of {topAttr[0].charAt(0).toUpperCase() + topAttr[0].slice(1)}</p>
                      <p className="text-sm text-slate-400">Highest growth attribute this week.</p>
                    </div>
                  </li>
                  {stats.bossesNames.length > 0 && (
                    <li className="flex items-center gap-4">
                      <span className="text-2xl" aria-hidden="true">⚔️</span>
                      <div>
                        <p className="text-white font-medium">Monster Hunter</p>
                        <p className="text-sm text-slate-400">Vanquished {stats.bossesNames.join(', ')}.</p>
                      </div>
                    </li>
                  )}
                  {stats.questsCompleted === 0 && (
                    <li className="flex items-center gap-4">
                      <span className="text-2xl" aria-hidden="true">💤</span>
                      <div>
                        <p className="text-white font-medium">The Great Rest</p>
                        <p className="text-sm text-slate-400">A peaceful week of recovery.</p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-8 text-center text-xs text-slate-600 font-mono">
                Generated by Chronicle Life RPG • playchronicle.app
              </div>
            </div>
          </motion.div>

          <div className="mt-8 flex gap-4">
            <button 
              className="btn-primary px-8 py-3 flex items-center gap-2"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'ENCODING...' : (
                <>
                  <span>📸</span> SAVE AS IMAGE
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </>
  );
}

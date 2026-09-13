'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';

interface Region {
  id: string;
  name: string;
  description: string;
  attribute: string;
  level: number;
  unlocked: boolean;
  required_level: number;
  color: string;
  bgGlow: string;
}

export default function WorldMapPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);

  const fetchRegions = async () => {
    try {
      const res = await fetch('/api/world-map');
      if (res.ok) {
        const data = await res.json();
        setRegions(data.regions);
      } else {
        toast.error('Failed to load the world map.');
      }
    } catch (err) {
      toast.error('Network error loading map.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    fetchRegions();
  }, []);

  // Helper to get region data
  const getRegion = (id: string) => regions.find(r => r.id === id) || null;

  if (loading) {
    return (
      <>
        <CRTOverlay enabled={crtEnabled} />
        <Sidebar />
        <main className="pb-20 md:pb-0 md:pl-64 min-h-screen flex items-center justify-center bg-[#0a0510]">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />

      <main className="pb-20 md:pb-0 md:pl-64 min-h-screen relative bg-[#050211] overflow-hidden">
        
        {/* UI Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20 pointer-events-none md:pl-72 flex justify-between items-start">
          <div>
            <h1 className="font-game text-4xl text-white glow-purple mb-2">WORLD MAP</h1>
            <p className="text-slate-400 text-sm max-w-md">
              Drag to explore. Discover new realms by leveling up your attributes to 10.
            </p>
          </div>
        </div>

        {/* Selected Region Panel */}
        {selectedRegion && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-24 right-6 w-80 glass-card pixel-border p-6 z-30 pointer-events-auto"
          >
            <button 
              onClick={() => setSelectedRegion(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>
            <h2 className={`font-game text-xl mb-2 ${selectedRegion.color}`}>{selectedRegion.name}</h2>
            
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2 py-1 rounded bg-black/50 border border-slate-700 font-game ${selectedRegion.unlocked ? selectedRegion.color : 'text-slate-500'}`}>
                {selectedRegion.attribute.toUpperCase()} LVL {selectedRegion.level}
              </span>
              {!selectedRegion.unlocked && (
                <span className="text-[10px] text-red-400 font-game">(REQUIRES LVL 10)</span>
              )}
            </div>

            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              {selectedRegion.unlocked 
                ? selectedRegion.description 
                : "This region is shrouded in fog. You lack the power to enter."}
            </p>

            {selectedRegion.unlocked && (
              <button className="w-full py-3 btn-primary text-xs font-game">
                ENTER REGION
              </button>
            )}
          </motion.div>
        )}

        {/* Interactive Map Area */}
        <div className="w-full h-screen cursor-grab active:cursor-grabbing overflow-hidden" ref={mapRef}>
          <motion.div 
            drag
            dragConstraints={mapRef}
            dragElastic={0.2}
            initial={{ scale: 1, x: 0, y: 0 }}
            className="w-[2000px] h-[1500px] relative origin-center"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #0a0510 0%, #000 100%)',
            }}
          >
            
            {/* Grid Lines for scale */}
            <div className="absolute inset-0 opacity-10 bg-[url('/grid.png')] pointer-events-none" />

            {/* --- MAP SVG RENDER --- */}
            <svg viewBox="0 0 2000 1500" className="absolute inset-0 w-full h-full">
              <defs>
                {/* Fog of War Filter */}
                <filter id="fogOfWar">
                  <feGaussianBlur stdDeviation="15" result="blur" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.8 0"/>
                </filter>
                
                {/* Glow Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Connecting Paths (Roads) */}
              <path d="M1000 750 L600 400" stroke="#334155" strokeWidth="4" strokeDasharray="10,10" fill="none" opacity="0.5" />
              <path d="M1000 750 L1400 400" stroke="#334155" strokeWidth="4" strokeDasharray="10,10" fill="none" opacity="0.5" />
              <path d="M1000 750 L600 1100" stroke="#334155" strokeWidth="4" strokeDasharray="10,10" fill="none" opacity="0.5" />
              <path d="M1000 750 L1400 1100" stroke="#334155" strokeWidth="4" strokeDasharray="10,10" fill="none" opacity="0.5" />
              
              {/* Central Hub (Always Unlocked) */}
              <circle cx="1000" cy="750" r="40" fill="#1e293b" stroke="#94a3b8" strokeWidth="4" filter="url(#glow)" />
              <text x="1000" y="820" fill="#cbd5e1" fontSize="16" fontFamily="monospace" textAnchor="middle" opacity="0.8">THE NEXUS</text>

              {/* Helper to render a region */}
              {regions.map((region) => {
                let cx = 0; let cy = 0; let path = "";
                
                if (region.id === 'intellect') {
                  cx = 600; cy = 400;
                  // Diamond shape
                  path = "M600 250 L700 400 L600 550 L500 400 Z"; 
                } else if (region.id === 'strength') {
                  cx = 1400; cy = 400;
                  // Jagged Volcano shape
                  path = "M1300 450 L1350 300 L1400 350 L1450 300 L1500 450 Z";
                } else if (region.id === 'discipline') {
                  cx = 600; cy = 1100;
                  // Blocky Fortress shape
                  path = "M500 1000 L700 1000 L700 1200 L500 1200 Z";
                } else if (region.id === 'creativity') {
                  cx = 1400; cy = 1100;
                  // Organic blob/forest shape
                  path = "M1400 950 Q1500 950 1500 1100 Q1500 1200 1400 1200 Q1300 1200 1300 1100 Q1300 950 1400 950 Z";
                }

                const isUnlocked = region.unlocked;
                
                return (
                  <g 
                    key={region.id} 
                    onClick={() => setSelectedRegion(region)}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                  >
                    {/* The Landmass */}
                    <path 
                      d={path} 
                      fill={isUnlocked ? region.bgGlow : '#0f172a'} 
                      stroke={isUnlocked ? region.bgGlow.replace('0.5', '1') : '#1e293b'} 
                      strokeWidth="6"
                      filter={isUnlocked ? "url(#glow)" : "url(#fogOfWar)"}
                    />
                    
                    {/* Label */}
                    <text 
                      x={cx} 
                      y={cy + 180} 
                      fill={isUnlocked ? '#f8fafc' : '#475569'} 
                      fontSize="20" 
                      fontFamily="monospace" 
                      textAnchor="middle"
                      style={{ textShadow: '2px 2px 4px #000' }}
                    >
                      {isUnlocked ? region.name.toUpperCase() : "UNKNOWN REGION"}
                    </text>

                    {/* Icon/Status in center */}
                    <text 
                      x={cx} 
                      y={cy + 10} 
                      fill={isUnlocked ? '#fff' : '#475569'} 
                      fontSize="36" 
                      textAnchor="middle"
                    >
                      {isUnlocked ? '✦' : '🔒'}
                    </text>
                  </g>
                );
              })}

            </svg>
          </motion.div>
        </div>
      </main>
    </>
  );
}

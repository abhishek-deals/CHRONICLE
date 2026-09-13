'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

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
              <button 
                onClick={() => router.push(`/quests`)}
                className="w-full py-3 btn-primary text-xs font-game"
              >
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

            {/* --- NEW CARTOON MAP BACKGROUND --- */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: 'url(/rpg-map.jpg)' }}
            />

            {/* Fog of War Overlays for the 4 quadrants */}
            {regions.map((region) => {
              // Determine coordinates based on ID (matching the generated image)
              let x = 0, y = 0, w = "50%", h = "50%";
              if (region.id === 'intellect') { x = 0; y = 0; } // Top Left
              else if (region.id === 'strength') { x = "50%"; y = 0; } // Top Right
              else if (region.id === 'discipline') { x = 0; y = "50%"; } // Bottom Left
              else if (region.id === 'creativity') { x = "50%"; y = "50%"; } // Bottom Right

              const isUnlocked = region.unlocked;

              return (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  className={`absolute cursor-pointer transition-all duration-700 ${
                    !isUnlocked ? 'bg-black/80 backdrop-blur-md' : 'hover:bg-white/10'
                  }`}
                  style={{ left: x, top: y, width: w, height: h }}
                >
                  {/* Glowing border for unlocked regions on hover, or dark border for locked */}
                  <div className={`absolute inset-0 border-2 transition-all duration-300 ${
                    isUnlocked ? 'border-transparent hover:border-white/50' : 'border-black/50'
                  }`} />
                  
                  {/* Status Indicator */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                      <span className="text-6xl mb-4 text-slate-800">🔒</span>
                      <span className="font-game text-xl tracking-widest text-slate-600">SHROUDED REALM</span>
                    </div>
                  )}
                  {isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-black/60 px-6 py-2 rounded-full border border-white/20">
                         <span className={`font-game text-sm ${region.color}`}>{region.name.toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </motion.div>
        </div>
      </main>
    </>
  );
}

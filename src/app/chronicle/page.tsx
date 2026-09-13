'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore, ChronicleEvent } from '@/store/game';

export default function ChroniclePage() {
  const { chronicleEvents, setChronicleEvents } = useGameStore();
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    fetch('/api/chronicle')
      .then(res => res.json())
      .then(data => {
        if (data.events) setChronicleEvents(data.events);
      })
      .catch(err => console.error('Failed to load chronicle', err));
  }, [setChronicleEvents]);

  const filteredEvents = chronicleEvents.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'QUESTS') return e.type === 'quest';
    if (filter === 'LEVELS') return e.type === 'level_up';
    if (filter === 'ACHIEVEMENTS') return e.type === 'achievement';
    return true;
  });

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />

      <main className="pb-24 md:pb-0 md:pl-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          
          <div className="mb-8">
            <h1 className="font-game text-2xl text-white glow-purple">THE CHRONICLE</h1>
            <p className="text-slate-400 text-sm mt-1">Your permanent RPG history and timeline</p>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 pb-2">
            {['ALL', 'QUESTS', 'LEVELS', 'ACHIEVEMENTS'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full font-game text-xs transition-colors whitespace-nowrap focus-ring ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-black/30 text-slate-400 border border-purple-900/30 hover:bg-purple-900/40'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {filteredEvents.length === 0 ? (
              <div className="glass-card p-10 rounded-xl text-center">
                <p className="text-4xl mb-4" aria-hidden="true">📜</p>
                <p className="font-game text-sm text-purple-300 mb-2">YOUR STORY STARTS HERE</p>
                <p className="text-slate-400 text-sm">Complete your first quest to create your first Chronicle entry.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-purple-900/50 ml-4 sm:ml-8 space-y-8 pb-8">
                {filteredEvents.map((event, i) => {
                  const d = new Date((event.created_at ?? event.date) || new Date().toISOString());
                  const isToday = new Date().toDateString() === d.toDateString();
                  const dateLabel = isToday ? 'TODAY' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
                  
                  let icon = '📜';
                  let color = 'text-slate-300';
                  if (event.type === 'level_up') { icon = '⬆️'; color = 'text-emerald-400'; }
                  if (event.type === 'achievement') { icon = '🏆'; color = 'text-yellow-400'; }

                  return (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative pl-8"
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full bg-purple-900 border-2 border-purple-500 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-purple-300" />
                      </div>

                      <div className="font-game text-xs text-purple-400 mb-1">{dateLabel}</div>
                      <div className={`font-game text-sm ${color} mb-1 flex items-center gap-2`}>
                        <span aria-hidden="true">{icon}</span>
                        {event.title}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {event.description}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}

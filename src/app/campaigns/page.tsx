'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore } from '@/store/game';
import { toast } from 'sonner';
import { ParticleBurst } from '@/components/ParticleBurst';

const CATEGORIES = ['Career', 'Study', 'Fitness', 'Personal', 'Creativity', 'Finance', 'Health', 'Social', 'Other'];
const DIFFICULTIES = ['Casual', 'Balanced', 'Challenging'];
const DURATIONS = [7, 14, 30, 90];

export default function CampaignsPage() {
  const { campaigns, setCampaigns } = useGameStore();
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeShakeId, setActiveShakeId] = useState<string | null>(null);
  const [burstPos, setBurstPos] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
    // Fetch from API
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.campaigns) setCampaigns(data.campaigns);
      })
      .catch(err => console.error('Failed to fetch campaigns', err));
  }, [setCampaigns]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) {
      toast.error('Please enter a goal!');
      return;
    }

    setIsGenerating(true);
    
    try {
      // 1. Fetch dynamic AI chapters
      const aiRes = await fetch('/api/ai/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), category, difficulty })
      });
      
      const aiData = await aiRes.json();
      if (!aiRes.ok) {
        toast.error(aiData.error || 'Failed to generate campaign. Is your API key valid?');
        setIsGenerating(false);
        return;
      }
      
      const generatedChapters = aiData.chapters;
      // 2. Create the campaign
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goal.trim().toUpperCase(),
          description: `Your epic journey to achieve: ${goal.trim()}`,
          category,
          difficulty,
          duration_days: duration,
          status: 'active',
          chapters: generatedChapters
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create campaign');
        return;
      }

      if (data.campaign) {
        setCampaigns([data.campaign, ...campaigns]);
        toast.success('Campaign created successfully! Your journey begins.', { icon: '⚔️' });
        setIsCreating(false);
        setGoal('');
      }
    } catch (err) {
      toast.error('Network error — please try again');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteChapter = async (campaignId: string, chapterId: string) => {
    try {
      const res = await fetch(`/api/campaigns/chapters/${chapterId}/complete`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Failed to complete chapter');
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`+${data.xp_gained} XP • +${data.gold_gained} Gold!`, { icon: '⚔️' });
        
        // Trigger epic effects!
        setActiveShakeId(campaignId);
        
        // Optimistically update UI
        setCampaigns(campaigns.map(c => {
          if (c.id === campaignId) {
            const updatedChapters = c.chapters.map(ch => 
              ch.id === chapterId ? { ...ch, completed: true } : ch
            );
            return {
              ...c,
              chapters: updatedChapters,
              status: data.campaign_completed ? 'completed' : c.status
            };
          }
          return c;
        }));

        if (data.campaign_completed) {
          toast.success('Campaign Conquered!', { icon: '🏆' });
        }
        
        setTimeout(() => setActiveShakeId(null), 800);
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to abandon this campaign? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
      
      const data = await res.json();
      if (data.success) {
        toast.success('Campaign abandoned.', { icon: '🗑️' });
        setCampaigns(campaigns.filter(c => c.id !== campaignId));
      }
    } catch (err) {
      toast.error('Network error while deleting campaign');
    }
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

      <main className="pb-20 md:pb-0 md:pl-64 min-h-screen relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-game text-2xl text-white glow-purple">RPG CAMPAIGNS</h1>
              <p className="text-slate-400 text-sm mt-1">Transform your goals into epic journeys</p>
            </div>
            {!isCreating && (
              <button 
                onClick={() => setIsCreating(true)}
                className="btn-primary text-xs py-2 px-4"
              >
                + CREATE CAMPAIGN
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card pixel-border p-6 rounded-xl mb-8"
              >
                <h2 className="font-game text-lg text-purple-300 mb-6">WHAT IS YOUR GOAL?</h2>
                <form onSubmit={handleCreateCampaign} className="space-y-6">
                  
                  <div>
                    <label className="block text-xs font-game text-slate-400 mb-2">GOAL DESCRIPTION</label>
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Become good at DSA"
                      className="input-field font-game text-sm"
                      disabled={isGenerating}
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-game text-slate-400 mb-2">CATEGORY</label>
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="input-field text-sm"
                        disabled={isGenerating}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-game text-slate-400 mb-2">DIFFICULTY</label>
                      <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="input-field text-sm"
                        disabled={isGenerating}
                      >
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-game text-slate-400 mb-2">DURATION</label>
                      <select 
                        value={duration} 
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="input-field text-sm"
                        disabled={isGenerating}
                      >
                        {DURATIONS.map(d => <option key={d} value={d}>{d} Days</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit" 
                      className="btn-primary flex-1 py-3 text-sm"
                      disabled={isGenerating}
                    >
                      {isGenerating ? 'GENERATING CAMPAIGN...' : 'CREATE CAMPAIGN'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsCreating(false)}
                      className="btn-secondary px-6"
                      disabled={isGenerating}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="campaign-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {campaigns.length === 0 ? (
                  <div className="glass-card p-10 rounded-xl text-center">
                    <p className="text-4xl mb-4" aria-hidden="true">🗺️</p>
                    <p className="font-game text-sm text-purple-300 mb-3">YOUR JOURNEY HASN'T BEGUN</p>
                    <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                      Choose a real-life goal and turn it into your first RPG campaign. The Sage will guide your path.
                    </p>
                    <button onClick={() => setIsCreating(true)} className="btn-primary text-sm py-3 px-8">
                      START CAMPAIGN
                    </button>
                  </div>
                ) : (
                  campaigns.map(campaign => {
                    const completedChapters = campaign.chapters.filter(c => c.completed).length;
                    const totalChapters = campaign.chapters.length;
                    const progressPct = totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100);
                    const isFullyConquered = progressPct === 100;
                    const isShaking = activeShakeId === campaign.id;

                    return (
                      <motion.div 
                        key={campaign.id} 
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          x: isShaking ? [-10, 10, -10, 10, 0] : 0 
                        }}
                        transition={{ 
                          x: { duration: 0.4 },
                          layout: { duration: 0.3 }
                        }}
                        className={`relative rounded-xl overflow-hidden ${isFullyConquered ? 'opacity-70 grayscale border border-slate-700' : 'glass-card pixel-border'}`}
                      >
                        {/* The Fortress Visual Backdrop */}
                        {!isFullyConquered && (
                          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
                            backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.4), transparent 70%)'
                          }}>
                            {/* Represents the gates/fortress breaking down */}
                            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                            {completedChapters > 0 && (
                               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cracked-earth.png')] opacity-30 mix-blend-overlay" />
                            )}
                            {completedChapters > 1 && (
                               <div className="absolute inset-0 bg-red-900/20 mix-blend-color-burn" />
                            )}
                          </div>
                        )}

                        <div className="relative z-10 p-6 border-b border-purple-900/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <h2 className={`font-game text-xl ${isFullyConquered ? 'text-slate-400 line-through' : 'text-white glow-purple'}`}>
                                {isFullyConquered ? 'CONQUERED: ' : 'FORTRESS: '}{campaign.title}
                              </h2>
                              <button
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                                title="Abandon Campaign"
                              >
                                🗑️
                              </button>
                            </div>
                            <span className="text-[10px] px-2 py-1 rounded bg-purple-900/50 text-purple-300 font-game border border-purple-700/50">
                              {campaign.category.toUpperCase()} • {campaign.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <p className={`text-sm mb-4 ${isFullyConquered ? 'text-slate-500' : 'text-slate-300'}`}>
                            {campaign.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-[10px] font-game text-slate-400 mb-2">
                            <span className={isFullyConquered ? 'text-emerald-400' : 'text-purple-400'}>
                              {isFullyConquered ? 'VICTORY SECURED' : 'BREACHING GATES...'}
                            </span>
                            <span>CHAPTER {Math.min(completedChapters + 1, totalChapters)} / {totalChapters}</span>
                          </div>
                          
                          {/* Progress bar styled as a glowing breach meter */}
                          <div className="h-3 bg-black/60 rounded-full border border-slate-700/50 overflow-hidden">
                            <motion.div 
                              className={`h-full ${isFullyConquered ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-700 to-fuchsia-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              style={{ 
                                boxShadow: isFullyConquered ? '0 0 10px rgba(16, 185, 129, 0.5)' : '0 0 10px rgba(168, 85, 247, 0.5)' 
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="relative z-10 p-6 bg-black/40">
                          <h3 className="font-game text-xs text-purple-500/70 mb-4 tracking-widest">CHAPTERS OF CONQUEST</h3>
                          <div className="space-y-4">
                            {campaign.chapters.map((chapter, idx) => {
                              const isActive = idx === completedChapters;
                              const isPast = idx < completedChapters;
                              
                              return (
                                <div key={chapter.id} className={`flex items-start gap-4 p-3 rounded-lg border ${isPast ? 'bg-black/30 border-emerald-900/30' : (isActive ? 'bg-purple-900/20 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-black/20 border-transparent opacity-60')}`}>
                                  <div className={`mt-0.5 text-lg ${isPast ? 'text-emerald-500' : (isActive ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'text-slate-600')}`}>
                                    {isPast ? '⚔️' : (isActive ? '🔥' : '🔒')}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-game text-sm mb-1 ${isPast ? 'text-emerald-400 line-through opacity-70' : (isActive ? 'text-white' : 'text-slate-500')}`}>
                                      {chapter.title}
                                    </div>
                                    <div className={`text-xs whitespace-pre-wrap leading-relaxed ${isPast ? 'text-slate-600' : (isActive ? 'text-slate-300' : 'text-slate-500')}`}>
                                      {chapter.description}
                                    </div>
                                    
                                    {isActive && campaign.status !== 'completed' && (
                                      <button 
                                        onClick={(e) => {
                                           const rect = e.currentTarget.getBoundingClientRect();
                                           setBurstPos({ x: rect.left + rect.width/2, y: rect.top + rect.height/2 });
                                           handleCompleteChapter(campaign.id, chapter.id);
                                        }}
                                        className="mt-3 btn-success text-[10px] py-1.5 px-4 font-game"
                                      >
                                        CONQUER STAGE ✓
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {burstPos && (
             <ParticleBurst x={burstPos.x} y={burstPos.y} onComplete={() => setBurstPos(null)} />
          )}
        </div>
      </main>
    </>
  );
}

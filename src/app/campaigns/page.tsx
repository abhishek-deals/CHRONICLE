'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore } from '@/store/game';
import { toast } from 'sonner';

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
          chapters: [
            { title: 'The Awakening', description: 'Laying the foundations of your journey.' },
            { title: 'The First Trial', description: 'Testing your resolve and commitment.' },
            { title: 'Mastery', description: 'Achieving true greatness and completing your goal.' },
          ]
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
      }
    } catch (err) {
      toast.error('Network error');
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

                    return (
                      <div key={campaign.id} className="glass-card pixel-border rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-purple-900/30">
                          <div className="flex justify-between items-start mb-2">
                            <h2 className="font-game text-lg text-white">{campaign.title}</h2>
                            <span className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300 font-game">
                              {campaign.category.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm mb-4">{campaign.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs font-game text-slate-500 mb-2">
                            <span>{progressPct}% COMPLETE</span>
                            <span>CHAPTER {Math.min(completedChapters + 1, totalChapters)} / {totalChapters}</span>
                          </div>
                          <div className="attr-bar-track h-2">
                            <div 
                              className="attr-bar-fill bg-purple-500" 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="p-6 bg-black/20">
                          <h3 className="font-game text-xs text-purple-400 mb-4">CHAPTERS</h3>
                          <div className="space-y-3">
                            {campaign.chapters.map((chapter, idx) => {
                              const isActive = idx === completedChapters;
                              return (
                                <div key={chapter.id} className="flex items-start gap-3">
                                  <div className={`mt-0.5 text-sm ${chapter.completed ? 'text-emerald-400' : (isActive ? 'text-purple-400' : 'text-slate-600')}`}>
                                    {chapter.completed ? '✓' : (isActive ? '●' : '○')}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`font-game text-sm ${chapter.completed ? 'text-slate-300' : (isActive ? 'text-white' : 'text-slate-500')}`}>
                                      {chapter.title}
                                    </div>
                                    <div className="text-xs text-slate-500 mb-2">{chapter.description}</div>
                                    
                                    {isActive && campaign.status !== 'completed' && (
                                      <button 
                                        onClick={() => handleCompleteChapter(campaign.id, chapter.id)}
                                        className="btn-success text-xs py-1.5 px-4 inline-flex items-center gap-2"
                                      >
                                        COMPLETE CHAPTER ✓
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </>
  );
}

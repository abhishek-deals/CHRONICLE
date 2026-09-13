'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { CRTOverlay } from '@/components/CRTOverlay';
import { useGameStore, Task } from '@/store/game';
import { QUEST_REWARDS } from '@/lib/rpg';

interface SuggestedQuest {
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Epic';
  attribute_tag: string;
  reason: string;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard', Epic: 'badge-epic'
};

const ATTR_ICONS: Record<string, string> = {
  intellect: '🧠', strength: '💪', discipline: '🎯', creativity: '🎨'
};

const SAGE_MESSAGES = [
  'Ah, a seeker of wisdom approaches...',
  'The path to greatness is forged one quest at a time.',
  'Your weakest attribute calls to be strengthened.',
  'I sense great potential within you, Adventurer.',
];

export default function AIMentorPage() {
  const { addTask } = useGameStore();
  const [quests, setQuests] = useState<SuggestedQuest[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(new Set());
  const [crtEnabled, setCrtEnabled] = useState(false);
  
  const [sageMessage, setSageMessage] = useState(
    () => SAGE_MESSAGES[Math.floor(Math.random() * SAGE_MESSAGES.length)]
  );
  const [displayedSageMessage, setDisplayedSageMessage] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);

  useEffect(() => {
    setCrtEnabled(localStorage.getItem('chronicle-crt') === 'true');
  }, []);

  // Typewriter Buffer Effect
  useEffect(() => {
    let currentLength = displayedSageMessage.length;
    if (sageMessage.length > currentLength) {
      const interval = setInterval(() => {
        setDisplayedSageMessage((prev) => {
          if (prev.length < sageMessage.length) {
            return sageMessage.slice(0, prev.length + 1);
          }
          clearInterval(interval);
          return prev;
        });
      }, 20); // 20ms per letter
      return () => clearInterval(interval);
    }
  }, [sageMessage, displayedSageMessage.length]);

  const speakText = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.8;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSuggest = async (customPrompt?: string) => {
    setIsLoading(true);
    setQuests([]);
    setAcceptedIds(new Set());
    
    setSageMessage('');
    setDisplayedSageMessage('');

    const userMessage = customPrompt || 'Suggest 3 quests for me.';
    const newMessages = [...messages, { role: 'user', content: userMessage }].slice(-10);
    setMessages(newMessages);

    try {
      const res = await fetch('/api/ai/suggest-quests', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      if (!res.ok) {
        throw new Error('API response not ok');
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.fallback || data.error) {
           throw new Error('Fallback triggered by server');
        }
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let text = '';
      let isProseComplete = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          text += decoder.decode(value, { stream: true });
          
          if (text.includes('PROSE:')) {
            const prosePart = text.split('PROSE:')[1];
            if (prosePart.includes('QUESTS:')) {
               const finalProse = prosePart.split('QUESTS:')[0].trim();
               if (!isProseComplete) {
                 setSageMessage(finalProse);
                 speakText(finalProse);
                 isProseComplete = true;
               }
            } else {
               setSageMessage(prosePart);
            }
          }
        }
        done = readerDone ?? false;
      }

      // Final parse for quests
      let parsedQuests: SuggestedQuest[] = [];
      const match = text.match(/QUESTS:\s*(\[[\s\S]*\])/);
      if (match && match[1]) {
        try {
          parsedQuests = JSON.parse(match[1].trim());
          setQuests(parsedQuests);
        } catch (e) {
          console.warn('Invalid JSON format, proceeding with empty quests');
        }
      }
      setIsFallback(false);
      
      const finalProseMatch = text.match(/PROSE:\s*([\s\S]*?)\s*QUESTS:/);
      const finalProse = finalProseMatch ? finalProseMatch[1].trim() : text;
      
      setMessages([...newMessages, { role: 'assistant', content: finalProse }]);
    } catch (err) {
      console.error(err);
      toast.error('Sage is having visions — showing backup quests');
      setIsFallback(true);
      const fallbackProse = "The cosmic winds obscure my sight. I offer these foundational tasks instead.";
      setSageMessage(fallbackProse);
      speakText(fallbackProse);
      setQuests([
        { title: 'Read for 30 minutes', category: 'Learning', difficulty: 'Easy', attribute_tag: 'intellect', reason: 'Keep your mind sharp.' },
        { title: 'Do 20 push-ups', category: 'Fitness', difficulty: 'Easy', attribute_tag: 'strength', reason: 'Build physical strength.' },
        { title: 'Work on a creative project', category: 'Creative', difficulty: 'Medium', attribute_tag: 'creativity', reason: 'Express your inner hero.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    handleSuggest(chatInput);
    setChatInput('');
  };

  const handleAccept = async (quest: SuggestedQuest, index: number) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quest.title,
          category: quest.category,
          difficulty: quest.difficulty,
          attribute_tag: quest.attribute_tag,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to accept quest');
        return;
      }

      const { task } = await res.json();
      addTask(task);
      setAcceptedIds((prev) => new Set([...prev, index]));
      toast.success(`Quest accepted: ${quest.title}`, { icon: '📜' });
    } catch {
      toast.error('Network error — please try again');
    }
  };

  const reward = (difficulty: string) =>
    QUEST_REWARDS[difficulty as keyof typeof QUEST_REWARDS] ?? { xp: 10, gold: 5 };

  return (
    <>
      <CRTOverlay enabled={crtEnabled} />
      <Sidebar />

      <main
        className="pb-20 md:pb-0 md:pl-64 min-h-screen"
        style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #050211 60%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="font-game text-xl text-blue-400" style={{ textShadow: '0 0 20px rgba(59,130,246,0.8)' }}>
              🔮 THE SAGE
            </h1>
          </div>
          <p className="text-center text-slate-400 text-sm mb-8">AI-Powered Quest Mentor</p>

          {/* Sage Avatar & Dialogue */}
          <div className="glass-card pixel-border p-8 rounded-xl mb-6 text-center relative"
            style={{ background: 'linear-gradient(135deg, rgba(10, 26, 46, 0.95), rgba(5, 2, 17, 0.95))' }}
          >
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${ttsEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
              title="Toggle Voice (Text-to-Speech)"
            >
              {ttsEnabled ? '🔊' : '🔇'}
            </button>

            <motion.div
              className="text-8xl mb-4 inline-block"
              animate={{ y: [0, -6, 0], filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              🧙
            </motion.div>
            <p className="font-game text-xs text-blue-300 mb-2">SAGE</p>
            
            <div className="min-h-[60px] flex items-center justify-center mb-6">
              <p className="text-slate-300 text-sm italic font-game leading-relaxed">
                &ldquo;{displayedSageMessage || (isLoading ? 'Consulting the cosmic threads...' : '')}&rdquo;
              </p>
            </div>

            <div className="flex gap-2 justify-center max-w-lg mx-auto">
              <button
                id="suggest-quests-btn"
                className="btn-primary px-8 py-3 w-full sm:w-auto"
                onClick={() => handleSuggest()}
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? '🔮 CONSULTING...' : '✨ SUGGEST 3 QUESTS'}
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="mt-6 flex gap-2 max-w-lg mx-auto">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask the Sage for specific advice..."
                className="flex-1 bg-black/40 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim()}
                className="bg-blue-900/50 hover:bg-blue-800/80 text-blue-300 border border-blue-500/30 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>

            {isFallback && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-slate-500 mt-3">
                (Using backup suggestions)
              </motion.p>
            )}
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card animate-pulse h-24 w-full rounded-xl bg-slate-800/50" />
              ))}
            </div>
          )}

          {/* Quest suggestions */}
          <AnimatePresence>
            {!isLoading && quests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="font-game text-xs text-slate-400 mb-4">
                  THE SAGE&apos;S RECOMMENDATIONS
                </h2>
                {quests.map((quest, i) => {
                  const accepted = acceptedIds.has(i);
                  const r = reward(quest.difficulty);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: accepted ? 0.6 : 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-5 rounded-xl transition-all"
                      style={{ borderColor: accepted ? 'rgba(16,185,129,0.4)' : undefined }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`badge ${DIFF_COLORS[quest.difficulty] || 'badge-easy'}`}>
                              {quest.difficulty}
                            </span>
                            <span className="text-slate-500 text-xs">{quest.category}</span>
                            <span className="text-xs text-slate-500">
                              {ATTR_ICONS[quest.attribute_tag]} {quest.attribute_tag}
                            </span>
                          </div>
                          <p className="text-slate-100 font-medium mb-1">{quest.title}</p>
                          {quest.reason && (
                            <p className="text-xs text-slate-500 italic mb-2">&ldquo;{quest.reason}&rdquo;</p>
                          )}
                          <p className="text-xs">
                            <span className="text-emerald-400">+{r.xp} XP</span>
                            {' • '}
                            <span className="text-yellow-400">+{r.gold} Gold</span>
                          </p>
                        </div>

                        <button
                          id={`accept-quest-${i}`}
                          className={`flex-shrink-0 ${accepted ? 'btn-success opacity-60' : 'btn-gold'} text-xs py-2 px-4 mt-2`}
                          onClick={() => handleAccept(quest, i)}
                          disabled={accepted}
                        >
                          {accepted ? '✓ ACCEPTED' : 'ACCEPT'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}

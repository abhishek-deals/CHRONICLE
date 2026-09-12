'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Task, CompleteResult, useGameStore } from '@/store/game';
import { ParticleBurst } from './ParticleBurst';
import { QUEST_REWARDS } from '@/lib/rpg';

interface Props {
  task: Task;
  onCompleted?: (result: CompleteResult) => void;
  onDeleted?: () => void;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: 'badge-easy',
  Medium: 'badge-medium',
  Hard: 'badge-hard',
  Epic: 'badge-epic',
};

const ATTR_ICONS: Record<string, string> = {
  intellect: '🧠',
  strength: '💪',
  discipline: '🎯',
  creativity: '🎨',
};

export function QuestCard({ task, onCompleted, onDeleted }: Props) {
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { optimisticComplete, rollbackComplete, applyCompleteResult, removeTask } = useGameStore();

  const isCompleted = task.status === 'completed';
  const reward = QUEST_REWARDS[task.difficulty as keyof typeof QUEST_REWARDS];

  const handleComplete = useCallback(
    async (e: React.MouseEvent | React.KeyboardEvent) => {
      if (completing || isCompleted) return;
      setCompleting(true);

      // Optimistic update
      optimisticComplete(task.id);

      // Particle burst at button position
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }

      try {
        const res = await fetch(`/api/tasks/${task.id}/complete`, {
          method: 'PATCH',
        });

        if (!res.ok) {
          const data = await res.json();
          rollbackComplete(task.id);
          toast.error(data.error || 'Failed to complete quest');
          return;
        }

        const data = await res.json();
        applyCompleteResult(task.id, data.result);

        toast.success(`+${data.result.xp_gained} XP • +${data.result.gold_gained} Gold!`, {
          icon: '⚔️',
        });

        if (data.result.level_up) {
          onCompleted?.(data.result);
        } else {
          onCompleted?.(data.result);
        }
      } catch {
        rollbackComplete(task.id);
        toast.error('Network error — please try again');
      } finally {
        setCompleting(false);
      }
    },
    [completing, isCompleted, task.id, optimisticComplete, rollbackComplete, applyCompleteResult, onCompleted]
  );

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });

      if (!res.ok) {
        toast.error('Failed to delete quest');
        setDeleting(false);
        return;
      }

      removeTask(task.id);
      toast.success('Quest abandoned');
      onDeleted?.();
    } catch {
      toast.error('Network error');
      setDeleting(false);
    }
  }, [deleting, task.id, removeTask, onDeleted]);

  const handleKeyComplete = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleComplete(e);
    }
  };

  return (
    <>
      {burst && (
        <ParticleBurst x={burst.x} y={burst.y} onComplete={() => setBurst(null)} />
      )}
      <AnimatePresence>
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className={`glass-card p-4 rounded-lg ${isCompleted ? 'grayscale' : ''}`}
          style={{
            borderColor: isCompleted ? 'rgba(75,85,99,0.3)' : undefined,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`badge ${DIFF_COLORS[task.difficulty] || 'badge-easy'}`}>
                  {task.difficulty}
                </span>
                <span className="text-slate-500 text-xs">{task.category}</span>
                {task.attribute_tag && (
                  <span className="text-slate-500 text-xs" aria-label={`Attribute: ${task.attribute_tag}`}>
                    {ATTR_ICONS[task.attribute_tag]} {task.attribute_tag}
                  </span>
                )}
              </div>
              <p
                className={`text-sm font-medium leading-snug ${
                  isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                }`}
              >
                {task.title}
              </p>
              {reward && (
                <p className="text-xs text-slate-500 mt-1">
                  <span className="text-emerald-500">+{reward.xp} XP</span>
                  {' • '}
                  <span className="text-yellow-500">+{reward.gold} Gold</span>
                </p>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isCompleted && (
                <button
                  ref={btnRef}
                  id={`complete-quest-${task.id}`}
                  className="btn-success text-xs py-1.5 px-3"
                  onClick={handleComplete}
                  onKeyDown={handleKeyComplete}
                  disabled={completing}
                  aria-label={`Complete quest: ${task.title}`}
                  aria-busy={completing}
                >
                  {completing ? '...' : '✓'}
                </button>
              )}
              {isCompleted && (
                <span className="text-emerald-400 text-lg" aria-label="Quest completed">✓</span>
              )}
              {!isCompleted && (
                <button
                  id={`delete-quest-${task.id}`}
                  className="btn-danger text-xs py-1.5 px-2"
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label={`Delete quest: ${task.title}`}
                  aria-busy={deleting}
                >
                  {deleting ? '...' : '🗑'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

'use client';

import { motion } from 'framer-motion';
import { xpProgress } from '@/lib/rpg';

interface Props {
  totalXp: number;
  level: number;
  animate?: boolean;
}

export function XpBar({ totalXp, level, animate = true }: Props) {
  const { current, needed } = xpProgress(totalXp);
  const pct = Math.min(100, (current / needed) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-emerald-400 font-medium">XP</span>
        <span className="text-xs text-slate-400">
          {current.toLocaleString()} / {needed.toLocaleString()}
        </span>
      </div>
      <div className="xp-bar-track">
        <motion.div
          className="xp-bar-fill"
          initial={animate ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

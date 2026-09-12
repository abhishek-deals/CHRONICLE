'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Boss } from '@/store/game';

interface Props {
  boss: Boss | null;
  isLoading?: boolean;
}

export function BossWidget({ boss, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="glass-card p-4 rounded-lg">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-3 w-full mb-2" />
        <div className="skeleton h-8 w-full" />
      </div>
    );
  }

  if (!boss) return null;

  const hpPct = Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100));
  const isDefeated = boss.status === 'defeated';

  return (
    <div
      className={`glass-card p-4 rounded-lg ${isDefeated ? 'pixel-border-gold' : 'pixel-border'}`}
      style={{
        background: isDefeated
          ? 'linear-gradient(135deg, rgba(26, 10, 0, 0.9), rgba(45, 22, 0, 0.9))'
          : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {isDefeated ? '💀' : '👹'}
          </span>
          <div>
            <p className="font-game text-xs text-purple-300 mb-0.5">WEEKLY BOSS</p>
            <p className="font-game text-sm text-white">{boss.name}</p>
          </div>
        </div>
        <span
          className={`badge ${isDefeated ? 'badge-easy' : 'badge-hard'}`}
          aria-label={isDefeated ? 'Boss defeated' : 'Boss active'}
        >
          {isDefeated ? 'DEFEATED' : 'ACTIVE'}
        </span>
      </div>

      {!isDefeated ? (
        <>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>HP</span>
            <span>
              {boss.current_hp.toLocaleString()} / {boss.max_hp.toLocaleString()}
            </span>
          </div>
          <div className="boss-hp-track mb-3">
            <motion.div
              className="boss-hp-fill"
              initial={{ width: '100%' }}
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <Link
            href="/boss"
            id="enter-battle-btn"
            className="btn-primary w-full text-center block py-2"
          >
            ⚔️ ENTER BATTLE
          </Link>
        </>
      ) : (
        <div className="text-center py-2">
          <p className="text-yellow-400 font-game text-xs mb-2 glow-gold">VICTORY!</p>
          <p className="text-slate-400 text-sm">New boss arrives next week</p>
        </div>
      )}
    </div>
  );
}

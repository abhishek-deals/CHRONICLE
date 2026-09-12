'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from './Confetti';

interface Props {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <>
      <Confetti />
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Level up! You reached level ${level}`}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 text-center px-8 py-12 rounded-xl pixel-border-gold"
            style={{ background: 'linear-gradient(135deg, #1a0a00, #2d1600, #1a0a00)' }}
            initial={{ scale: 0.3, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Stars */}
            <motion.div
              className="text-5xl mb-4"
              animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ⭐
            </motion.div>

            <motion.p
              className="font-game text-yellow-400 text-sm mb-2 glow-gold"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              LEVEL UP!
            </motion.p>

            <motion.h2
              className="font-game text-4xl text-white mb-4 glow-gold"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {level}
            </motion.h2>

            <motion.p
              className="text-yellow-200/80 text-lg mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              You reached Level {level}!<br />
              <span className="text-sm text-yellow-200/60">Your legend grows stronger...</span>
            </motion.p>

            <motion.button
              id="levelup-continue-btn"
              className="btn-gold px-8 py-3"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              autoFocus
            >
              CONTINUE
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

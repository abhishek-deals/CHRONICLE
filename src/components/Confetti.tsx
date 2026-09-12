'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#a855f7', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#fff'];

export default function Confetti() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pieces: HTMLDivElement[] = [];

    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: -10px;
        background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        transform: rotate(${Math.random() * 360}deg);
        animation: confettiFall ${Math.random() * 2 + 1.5}s ease-in ${Math.random() * 0.8}s forwards;
      `;
      container.appendChild(el);
      pieces.push(el);
    }

    // Add keyframes if not present
    if (!document.getElementById('confetti-keyframes')) {
      const style = document.createElement('style');
      style.id = 'confetti-keyframes';
      style.textContent = `
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      pieces.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden"
      aria-hidden="true"
    />
  );
}

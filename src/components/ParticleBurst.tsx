'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#a855f7', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899'];

interface Props {
  x: number;
  y: number;
  onComplete: () => void;
}

export function ParticleBurst({ x, y, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    const count = 20;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      const el = document.createElement('div');
      el.className = 'particle';
      el.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        --tx: ${tx}px;
        --ty: ${ty}px;
        animation-delay: ${Math.random() * 0.1}s;
      `;
      container.appendChild(el);
      particles.push(el);
    }

    const timer = setTimeout(() => {
      particles.forEach((p) => p.remove());
      onComplete();
    }, 900);

    return () => {
      clearTimeout(timer);
      particles.forEach((p) => p.remove());
    };
  }, [x, y, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    />
  );
}

'use client';

import { useEffect, useRef } from 'react';

interface Props {
  enabled: boolean;
}

export function CRTOverlay({ enabled }: Props) {
  if (!enabled) return null;
  return <div className="crt-overlay" aria-hidden="true" />;
}

export function useCRTSettings() {
  // Default off — per spec "off by default"
  const key = 'chronicle-crt';
  const get = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(key) === 'true';
  };
  const set = (val: boolean) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, String(val));
  };
  return { get, set };
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/game';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'HQ',       icon: '🏠' },
  { href: '/quests',    label: 'QUESTS',   icon: '📜' },
  { href: '/boss',      label: 'BOSS',     icon: '👹' },
  { href: '/ai-mentor', label: 'SAGE',     icon: '🔮' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const reset = useGameStore((s) => s.reset);
  const profile = useGameStore((s) => s.profile);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    reset();
    router.push('/');
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 border-b border-purple-900/50"
      style={{ background: 'rgba(5, 2, 17, 0.95)', backdropFilter: 'blur(12px)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 focus-ring rounded">
            <span className="font-game text-purple-400 text-xs glow-purple tracking-wider">
              ⚔️ CHRONICLE
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1" role="menubar">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: gold + logout */}
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-yellow-400 font-game text-xs glow-gold hidden sm:block">
                💰 {profile.gold.toLocaleString()}
              </span>
            )}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="btn-danger text-xs py-1 px-3"
              aria-label="Logout"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

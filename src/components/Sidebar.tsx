'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/game';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard',   label: 'DASHBOARD',    icon: '🏠' },
  { href: '/oracle',      label: 'ORACLE',       icon: '🔮' },
  { href: '/quests',      label: 'QUESTS',       icon: '📜' },
  { href: '/arena',       label: 'DECISION',     icon: '⚖️' },
  { href: '/boss',        label: 'BOSS BATTLE',  icon: '⚔️' },
  { href: '/campaigns',   label: 'CAMPAIGNS',    icon: '🗺️' },
  { href: '/world',       label: 'WORLD MAP',    icon: '🌍' },
  { href: '/achievements',label: 'ACHIEVEMENTS', icon: '🏆' },
  { href: '/simulator',   label: 'SIMULATOR',    icon: '🧬' },
  { href: '/chronicle',   label: 'CHRONICLE',    icon: '⏳' },
  { href: '/ai-mentor',   label: 'SAGE',         icon: '🧙‍♂️' },
  { href: '/settings',    label: 'SETTINGS',     icon: '⚙️' },
];

export function Sidebar() {
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
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-purple-900/50 z-40"
        style={{ background: 'rgba(5, 2, 17, 0.75)', backdropFilter: 'blur(16px)' }}
        aria-label="Sidebar navigation"
      >
        <div className="p-6 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 focus-ring rounded">
            <Image src="/logo.jpg" alt="CHRONICLE Logo" width={40} height={40} className="rounded-full shadow-[0_0_15px_#a855f7]" priority />
            <span className="font-game text-purple-400 text-lg glow-purple tracking-widest">
              CHRONICLE
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg font-game text-xs transition-all focus-ring ${
                  isActive 
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-purple-900/30">
          {profile && (
            <div className="mb-4 text-center px-4 py-3 rounded-lg bg-black/30 border border-yellow-900/30">
              <span className="text-yellow-400 font-game text-sm glow-gold block">
                💰 {profile.gold.toLocaleString()}
              </span>
              <span className="text-slate-500 text-[10px]">GOLD</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full btn-danger text-xs py-3 px-4 flex items-center justify-center gap-2"
            aria-label="Logout"
          >
            LOGOUT
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM BAR */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t border-purple-900/50 z-50 flex flex-wrap items-center justify-around pb-safe"
        style={{ background: 'rgba(5, 2, 17, 0.75)', backdropFilter: 'blur(16px)' }}
        aria-label="Mobile bottom navigation"
      >
        <div className="flex w-full overflow-x-auto hide-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[20%] py-3 focus-ring ${
                  isActive ? 'text-purple-400' : 'text-slate-500'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl mb-1" aria-hidden="true">{item.icon}</span>
                <span className="font-game" style={{ fontSize: '8px' }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

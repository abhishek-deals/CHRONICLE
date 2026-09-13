import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chronicle — Life RPG | Turn Your Life Into a Legend',
  description: 'Gamify your real life. Complete quests, earn XP, level up your character, defeat weekly bosses, and get AI-powered quest suggestions. Start your legend today.',
};

const features = [
  {
    icon: '📜',
    title: 'QUEST SYSTEM',
    desc: 'Turn your daily tasks into epic quests. Choose difficulty, earn XP and Gold, and watch your character grow stronger with every completion.',
    color: 'rgba(124, 58, 237, 0.2)',
    border: 'rgba(124, 58, 237, 0.4)',
  },
  {
    icon: '👹',
    title: 'BOSS BATTLES',
    desc: 'Every week, a new boss spawns. Complete quests to deal damage and defeat it before the week ends — your hardest quests hit hardest.',
    color: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  {
    icon: '🔮',
    title: 'AI MENTOR',
    desc: 'The Sage analyzes your weakest attributes and suggests personalized quests using Claude AI — accept them with one click.',
    color: 'rgba(59, 130, 246, 0.2)',
    border: 'rgba(59, 130, 246, 0.4)',
  },
];

const stats = [
  { value: '4', label: 'Attributes to train' },
  { value: '∞', label: 'Quests to complete' },
  { value: '1', label: 'Legend to build' },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#050211] relative"
    >
      {/* Hero Background Image with Fade */}
      <div 
        className="absolute inset-0 z-0 h-[800px] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, rgba(5, 2, 17, 0.3) 0%, rgba(5, 2, 17, 0.8) 60%, #050211 100%),
            url('/hero-bg.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* CRT grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* Scanlines */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04] z-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)',
        }}
        aria-hidden="true"
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="CHRONICLE Logo" width={32} height={32} className="rounded-full shadow-[0_0_10px_#a855f7]" priority />
          <span className="font-game text-purple-400 text-base glow-purple">CHRONICLE</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            id="nav-login-btn"
            className="btn-danger text-xs py-2 px-4"
          >
            SIGN IN
          </Link>
          <Link
            href="/signup"
            id="nav-signup-btn"
            className="btn-primary text-xs py-2 px-4"
          >
            PLAY FREE
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="text-center px-4 py-20 sm:py-32 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-700/50">
            <span className="font-game text-xs text-purple-300">⚡ LIFE RPG v1.0</span>
          </div>

          <h1 className="font-game text-3xl sm:text-5xl text-white mb-6 leading-tight glow-purple">
            TURN YOUR LIFE
            <br />
            <span className="text-purple-400">INTO A LEGEND</span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Your daily tasks are quests. Your growth is XP. Your struggles are boss battles.
            Start your chronicle — and become the hero of your own story.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              id="hero-signup-btn"
              className="btn-primary text-sm py-4 px-10 inline-block"
            >
              ⚔️ BEGIN YOUR LEGEND
            </Link>
            <Link
              href="/login"
              id="hero-login-btn"
              className="inline-block px-10 py-4 rounded-lg border border-purple-700/50 text-purple-300 font-game text-sm hover:border-purple-500 hover:text-purple-200 transition-all focus-ring"
            >
              CONTINUE QUEST
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-20">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-game text-3xl text-purple-400 glow-purple">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left" aria-label="Features">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-xl p-6 flex flex-col gap-3"
                style={{
                  background: f.color,
                  border: `1px solid ${f.border}`,
                  backdropFilter: 'blur(6px)',
                }}
              >
                <span className="text-4xl" aria-hidden="true">{f.icon}</span>
                <h2 className="font-game text-sm text-white">{f.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES BG WRAPPER: covers How It Works + CTA ── */}
        <div
          style={{
            backgroundImage: `
              linear-gradient(to bottom,
                rgba(5,2,17,0.80) 0%,
                rgba(5,2,17,0.50) 15%,
                rgba(5,2,17,0.50) 85%,
                rgba(5,2,17,0.85) 100%
              ),
              url('/features-bg.jpg')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="font-game text-xl text-white mb-12 glow-purple">HOW IT WORKS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'CREATE', desc: 'Sign up and forge your adventurer', icon: '⚔️' },
              { step: '02', title: 'QUEST',  desc: 'Add tasks as quests with difficulty', icon: '📜' },
              { step: '03', title: 'LEVEL',  desc: 'Complete quests to earn XP & gold', icon: '⬆️' },
              { step: '04', title: 'BATTLE', desc: 'Defeat weekly boss battles for glory', icon: '👹' },
            ].map((item) => (
              <div key={item.step} className="p-5 rounded-xl text-center" style={{ backdropFilter: 'blur(8px)', background: 'rgba(10,5,30,0.65)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div className="font-game text-xs text-purple-500 mb-2">{item.step}</div>
                <div className="text-3xl mb-3" aria-hidden="true">{item.icon}</div>
                <div className="font-game text-xs text-white mb-2">{item.title}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center px-4 py-20">
          <div className="pixel-border max-w-2xl mx-auto p-10 rounded-2xl" style={{ backdropFilter: 'blur(12px)', background: 'rgba(10,5,30,0.65)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <p className="text-5xl mb-4" aria-hidden="true">⚔️</p>
            <h2 className="font-game text-xl text-white mb-4 glow-purple">
              YOUR LEGEND AWAITS
            </h2>
            <p className="text-slate-400 mb-8">
              Join adventurers turning their daily grind into an epic journey.
              Free to play. No credit card required.
            </p>
            <Link
              href="/signup"
              id="footer-cta-btn"
              className="btn-primary inline-block py-4 px-12 text-sm"
            >
              START FOR FREE →
            </Link>
          </div>
        </section>
        </div>
        {/* ── END FEATURES BG WRAPPER ────────────────────────── */}

        {/* Footer */}
        <footer className="border-t border-purple-900/30 bg-black/40 mt-12 pt-16 pb-8 relative z-10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/logo.jpg" alt="CHRONICLE Logo" width={32} height={32} className="rounded-full shadow-[0_0_10px_#a855f7]" />
                  <span className="font-game text-purple-400 text-base glow-purple">CHRONICLE</span>
                </div>
                <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                  Gamify your real life. Complete quests, earn XP, level up your character, and build your legend today.
                </p>
              </div>
              
              <div>
                <h3 className="font-game text-white text-sm mb-4">EXPLORE</h3>
                <ul className="space-y-3">
                  <li><Link href="/login" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"><span className="text-purple-500/50">▸</span> Sign In</Link></li>
                  <li><Link href="/signup" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"><span className="text-purple-500/50">▸</span> Play Free</Link></li>
                  <li><a href="#" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"><span className="text-purple-500/50">▸</span> Features</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"><span className="text-purple-500/50">▸</span> Hall of Fame</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-game text-white text-sm mb-4">LEGAL</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"><span className="text-purple-500/50">▸</span> Terms of Service</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"><span className="text-purple-500/50">▸</span> Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"><span className="text-purple-500/50">▸</span> Contact Us</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-purple-900/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-xs">
                © {new Date().getFullYear()} Chronicle Life RPG. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-slate-500 text-xs font-game">
                BUILT WITH ⚔️ FOR ADVENTURERS
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

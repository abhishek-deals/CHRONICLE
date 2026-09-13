'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ── Signup ─────────────────────────────── */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || username.trim().length < 2) {
      setError('Adventurer name must be at least 2 characters');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, username: username.trim() }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create character. Please try again.');
        return;
      }

      toast.success('⚔️ Character forged successfully! Entering the Realm...');
      
      // Since they are auto-confirmed by the server, we just log them in on the client!
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError('Created successfully, but failed to log in automatically.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth ─────────────────────────────────── */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to start Google login');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #050211 70%)' }}
    >
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-500 opacity-30"
            style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [-10, 10, -10], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 focus-ring rounded">
            <motion.div
              className="flex flex-col items-center gap-4"
              animate={{ filter: ['drop-shadow(0 0 10px #a855f7)', 'drop-shadow(0 0 20px #a855f7)', 'drop-shadow(0 0 10px #a855f7)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Image src="/logo.jpg" alt="CHRONICLE Logo" width={80} height={80} className="rounded-full shadow-[0_0_20px_#a855f7]" priority />
              <span className="font-game text-2xl text-purple-400 glow-purple">
                CHRONICLE
              </span>
            </motion.div>
          </Link>
          <AnimatePresence mode="wait">
            <motion.div key="form-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="font-game text-lg text-white mb-2">CREATE CHARACTER</h1>
              <p className="text-slate-400 text-sm">Begin your legendary journey</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card */}
        <div className="glass-card pixel-border p-8 rounded-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSignup} noValidate>
                <div className="mb-5">
                  <label htmlFor="signup-username" className="block text-sm text-slate-300 mb-2 font-medium">
                    Adventurer Name
                  </label>
                  <input
                    id="signup-username"
                    type="text"
                    className="input-field"
                    placeholder="Sir Codesalot"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={loading}
                    aria-required="true"
                    maxLength={32}
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="signup-email" className="block text-sm text-slate-300 mb-2 font-medium">
                    Email Address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    className="input-field"
                    placeholder="hero@quest.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                    aria-required="true"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="signup-password" className="block text-sm text-slate-300 mb-2 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pr-12"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      disabled={loading}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs px-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Must be at least 8 characters
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm"
                    role="alert"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  id="signup-submit-btn"
                  type="submit"
                  className="btn-primary w-full py-3 text-sm"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      CREATING SCROLL...
                    </span>
                  ) : (
                    'BEGIN YOUR JOURNEY ⚔️'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-slate-700 hover:bg-white/10 hover:border-slate-500 transition-all text-slate-300 font-medium text-sm group"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-slate-500 text-sm">
          Already a legend?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors focus-ring rounded">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

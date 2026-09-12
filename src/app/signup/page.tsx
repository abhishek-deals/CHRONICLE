'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || username.trim().length < 2) {
      setError('Username must be at least 2 characters'); return;
    }
    if (!email.trim()) { setError('Email is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Sign in immediately after signup
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email: email.trim(), password });

      toast.success('Your legend begins!');
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #050211 70%)',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 focus-ring rounded">
            <span className="font-game text-2xl text-purple-400 glow-purple">⚔️ CHRONICLE</span>
          </Link>
          <h1 className="font-game text-lg text-white mb-2">CREATE CHARACTER</h1>
          <p className="text-slate-400 text-sm">Begin your legendary journey</p>
        </div>

        <div className="glass-card pixel-border p-8 rounded-xl">
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
                Email
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
                Password <span className="text-slate-500 font-normal">(min 6 characters)</span>
              </label>
              <input
                id="signup-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
                aria-required="true"
                minLength={6}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm"
                role="alert"
                aria-live="polite"
              >
                {error}
              </motion.div>
            )}

            <button
              id="signup-submit-btn"
              type="submit"
              className="btn-primary w-full py-3"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'CREATING CHARACTER...' : 'BEGIN YOUR LEGEND'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-slate-500 text-sm">
          Already a legend?{' '}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 transition-colors focus-ring rounded"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

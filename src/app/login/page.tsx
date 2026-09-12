'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(
          authError.message.includes('Invalid login')
            ? 'Invalid email or password'
            : authError.message
        );
        return;
      }

      toast.success('Welcome back, Adventurer!');
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
      {/* CRT grid lines */}
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
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 focus-ring rounded">
            <span className="font-game text-2xl text-purple-400 glow-purple">⚔️ CHRONICLE</span>
          </Link>
          <h1 className="font-game text-lg text-white mb-2">WELCOME BACK</h1>
          <p className="text-slate-400 text-sm">Sign in to continue your legend</p>
        </div>

        {/* Form */}
        <div className="glass-card pixel-border p-8 rounded-xl">
          <form onSubmit={handleLogin} noValidate>
            <div className="mb-5">
              <label htmlFor="login-email" className="block text-sm text-slate-300 mb-2 font-medium">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="adventurer@realm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                aria-required="true"
                aria-invalid={!!error}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="login-password" className="block text-sm text-slate-300 mb-2 font-medium">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                aria-required="true"
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
              id="login-submit-btn"
              type="submit"
              className="btn-primary w-full py-3 text-center"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'SIGNING IN...' : 'ENTER THE REALM'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-slate-500 text-sm">
          New adventurer?{' '}
          <Link
            href="/signup"
            className="text-purple-400 hover:text-purple-300 transition-colors focus-ring rounded"
          >
            Create your character
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

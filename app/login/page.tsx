'use client';

import { EnvelopeSimple, LockKey } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useCallback(async () => {
    if (!email || !password) {
      setError('Please Enter Email And Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = (await response.json()) as {
        email?: string;
        error?: string;
        success?: boolean;
        userId?: string;
      };

      if (response.ok && data.success) {
        localStorage.setItem('authenticated', 'true');
        if (data.email) {
          localStorage.setItem('userEmail', data.email);
        }
        if (data.userId) {
          localStorage.setItem('userId', data.userId);
        }
        router.push('/console');
      } else {
        setError(data.error ?? 'Login Failed');
      }
    } catch {
      setError('Server Is Broken');
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 w-full max-w-md border border-emerald-900">
        <h1 className="text-2xl font-medium mb-6 text-center text-emerald-900">Login</h1>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-emerald-900">
              <EnvelopeSimple size={18} />
              Email
            </label>
            <input
              className="w-full px-4 py-2 border border-emerald-900 rounded-lg focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="your@email.com"
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-emerald-900">
              <LockKey size={18} />
              Password
            </label>
            <input
              className="w-full px-4 py-2 border border-emerald-900 rounded-lg focus:ring-2 focus:ring-emerald-900 focus:border-emerald-900"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void login();
                }
              }}
              placeholder="••••••••"
              type="password"
              value={password}
            />
          </div>

          {error && (
            <div className="p-3 bg-emerald-900/10 text-emerald-900 rounded-lg text-sm border border-emerald-900">
              {error}
            </div>
          )}

          <button
            className="w-full bg-emerald-900 text-white py-3 rounded-lg font-medium hover:bg-emerald-950 disabled:bg-emerald-900/50 disabled:text-white/70 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
            onClick={() => {
              void login();
            }}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

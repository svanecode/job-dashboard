'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // const router = useRouter(); // Not used currently

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords matcher ikke'
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password skal være mindst 6 tegn'
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.signUp(email, password, name);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      console.error('Error in signup:', error);
      setMessage({
        type: 'error',
        text: 'Der opstod en fejl'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-radial" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card-mobile p-6 md:p-8 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-white">Opret konto</h2>
              <p className="text-slate-400 text-sm">Få adgang til CFO Dashboard</p>
            </div>

            {message && (
              <div
                className={`rounded-xl p-3 border ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm text-slate-300">Navn *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Dit fulde navn"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-slate-300">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full"
                  placeholder="din@email.dk"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm text-slate-300">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm text-slate-300">Bekræft password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-[#005EB8] hover:bg-[#0091DA] text-white font-medium py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
              >
                {isLoading ? 'Opretter konto...' : 'Opret konto'}
              </button>

              <p className="text-center text-sm text-slate-400">
                Har du allerede en konto?{' '}
                <Link href="/login" className="text-slate-200 hover:text-white font-medium">
                  Log ind her
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('description');
    const successMessage = searchParams.get('message');

    if (error === 'invalid_invite') {
      setMessage({
        type: 'error',
        text: 'Ugyldig invite link. Kontakt administrator.'
      });
    } else if (error === 'not_authenticated') {
      setMessage({
        type: 'error',
        text: 'Du skal være logget ind for at fortsætte.'
      });
    } else if (error === 'session_error') {
      setMessage({
        type: 'error',
        text: 'Der opstod en fejl med din session. Prøv igen.'
      });
    } else if (error === 'access_denied') {
      setMessage({
        type: 'error',
        text: errorDescription || 'Adgang nægtet. Prøv igen.'
      });
                 } else if (successMessage === 'password_set') {
               setMessage({
                 type: 'success',
                 text: 'Password oprettet! Du kan nu logge ind.'
               });
             } else if (successMessage === 'email_confirmed') {
               setMessage({
                 type: 'success',
                 text: 'Email bekræftet! Du kan nu logge ind.'
               });
             }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await authService.signInWithPassword(email, password);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Login succesfuld! Omdirigerer...'
        });
        setEmail('');
        setPassword('');
        
        // Give more time for session to be properly established and cookies to be set
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage({
        type: 'error',
        text: 'Der opstod en uventet fejl'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-white">Log ind</h2>
        <p className="text-slate-400 text-sm">Fortsæt til CFO Dashboard</p>
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
          <label htmlFor="email" className="text-sm text-slate-300">
            Email adresse
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input w-full"
            placeholder="din@email.dk"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm text-slate-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {isLoading ? 'Logger ind...' : 'Log ind'}
        </button>
      </form>

      <div className="text-center space-y-1">
        <p className="text-sm text-slate-400">
          <a href="/auth/reset-password" className="text-slate-300 hover:text-white">
            Glemt password?
          </a>
        </p>
        <p className="text-sm text-slate-400">
          Har du ikke en konto?{' '}
          <a href="/signup" className="text-slate-200 hover:text-white font-medium">
            Opret konto
          </a>
        </p>
      </div>
    </div>
  );
} 
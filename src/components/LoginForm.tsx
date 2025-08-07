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
      console.log('Attempting login with:', email);
      const result = await authService.signInWithPassword(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Login succesfuld! Omdirigerer...'
        });
        setEmail('');
        setPassword('');
        
        // Give a bit more time for user profile creation
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          router.push('/');
        }, 1500);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log ind på CFO Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Indtast din email og password
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
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
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email adresse"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
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
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              disabled={isLoading}
            />
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logger ind...' : 'Log ind'}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            <a 
              href="/auth/reset-password" 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Glemt password?
            </a>
          </p>
          <p className="text-sm text-gray-600">
            Har du ikke en konto?{' '}
            <a 
              href="/signup" 
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Opret konto
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 
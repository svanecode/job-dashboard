'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Bookmark, LogOut, User } from 'lucide-react';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleOpenProfile = () => {
    setIsOpen(false);
    router.push('/profile');
  };

  if (!user) return null;

  return (
    <div className="relative z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-slate-200 hover:text-white transition-all duration-200 hover:bg-white/10 px-3 py-2 rounded-lg"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block text-sm font-medium">{user.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl ring-1 ring-white/10 border border-white/5 py-2">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="font-semibold text-white text-sm">{user.name}</p>
            {user.company && (
              <p className="text-slate-300 text-sm mt-0.5">{user.company}</p>
            )}
            <p className="text-xs text-slate-400 mt-1.5 px-2 py-1 bg-slate-700/50 rounded-full inline-block">
              {user.role === 'admin' ? 'Administrator' : 'Bruger'}
            </p>
          </div>
          
          <button
            onClick={handleOpenProfile}
            className="block w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-3 group"
          >
            <Bookmark className="size-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            Gemte jobs & kommentarer
          </button>
          
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-3 group"
          >
            <LogOut className="size-4 text-red-400 group-hover:text-red-300 transition-colors" />
            Log ud
          </button>
        </div>
      )}
    </div>
  );
} 
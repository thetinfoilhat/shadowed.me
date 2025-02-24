'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  initialMode?: AuthMode;
}

export default function AuthModal({ isOpen, onCloseAction, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onCloseAction();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to authenticate. Please check your credentials.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#4A3C2D] mb-6">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <p className="text-red-500 mb-4 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#725A44] text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#E2D9D0] focus:outline-none focus:ring-2 focus:ring-[#725A44]"
              required
            />
          </div>

          <div>
            <label className="block text-[#725A44] text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[#E2D9D0] focus:outline-none focus:ring-2 focus:ring-[#725A44]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors"
          >
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[#725A44]">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-[#8B6D54] hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[#8B6D54] hover:underline"
              >
                Log in
              </button>
            </p>
          )}
        </div>

        <button
          onClick={onCloseAction}
          className="absolute top-4 right-4 text-[#725A44] hover:text-[#8B6D54]"
        >
          ✕
        </button>
      </div>
    </div>
  );
} 
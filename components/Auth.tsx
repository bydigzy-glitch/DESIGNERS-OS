
import React, { useState } from 'react';
import { User } from '../types';
import { Sparkles, ArrowRight, Lock } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate Network Request
    setTimeout(() => {
      const mockUser: User = {
        id: 'user-1',
        name: name || 'Designpreneur',
        email: email,
        isPro: true,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
      };
      onLogin(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-blue/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#141416] border border-gray-800 p-8 rounded-[2rem] relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-accent-blue to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/40">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Join the War Room'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Enter your credentials to access the OS.' : 'Initialize your Designpreneur journey.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:border-accent-blue transition-colors"
                placeholder="Ex. Virgil Abloh"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:border-accent-blue transition-colors"
              placeholder="name@brand.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Password</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-white focus:outline-none focus:border-accent-blue transition-colors"
                placeholder="••••••••"
              />
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !email || !password}
            className="w-full bg-white text-black font-bold py-4 rounded-xl mt-6 hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isLogin ? 'Access Dashboard' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Create one." : "Already have an account? Sign in."}
          </button>
        </div>
      </div>
    </div>
  );
};

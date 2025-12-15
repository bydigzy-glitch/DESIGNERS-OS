
import React, { useState } from 'react';
import { User } from '../types';
import { signIn, signUp, supabase } from '../services/supabaseClient';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, Check, ArrowLeft, Eye, EyeOff, Hexagon, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuthProps {
    onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const triggerError = (msg: string) => {
        setError(msg);
        setIsLoading(false);
    };

    const handleGuestLogin = () => {
        const guestUser: User = {
            id: 'guest-' + Date.now(),
            name: 'Guest Designer',
            email: 'guest@designos.local',
            isPro: false,
            isGuest: true,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
            preferences: {
                theme: 'dark',
                notifications: false,
                displayName: 'Guest'
            },
            tokens: 10
        };
        onLogin(guestUser);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);

        const cleanEmail = email.trim();

        if (view !== 'LOGIN' && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
            triggerError("Please enter a valid email address.");
            return;
        }

        if ((view === 'REGISTER' || view === 'LOGIN') && password.length < 6) {
            triggerError("Password must be at least 6 characters.");
            return;
        }

        try {
            if (view === 'LOGIN') {
                const { data, error: authError } = await signIn(cleanEmail, password);
                if (authError) {
                    triggerError(authError.message || "Login failed. Check your credentials.");
                    return;
                }
                if (data.user) {
                    let { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    if (!profile) {
                        const newProfile = {
                            id: data.user.id,
                            email: data.user.email || cleanEmail,
                            name: data.user.user_metadata?.name || 'User',
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
                            tokens: 50000,
                            created_at: new Date().toISOString()
                        };
                        const { error: createError } = await supabase.from('users').insert(newProfile);
                        if (!createError) profile = newProfile;
                    }

                    const appUser: User = {
                        id: data.user.id,
                        name: profile?.name || data.user.user_metadata?.name || 'User',
                        email: data.user.email || cleanEmail,
                        isPro: false,
                        avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
                        preferences: profile?.preferences || { theme: 'dark', notifications: true },
                        tokens: profile?.tokens || 50000,
                        aiMemory: profile?.ai_memory
                    };
                    onLogin(appUser);
                }
            } else if (view === 'REGISTER') {
                if (!name.trim()) {
                    triggerError("Full Name is required.");
                    return;
                }

                const { data, error: authError } = await signUp(cleanEmail, password, name);
                if (authError) {
                    triggerError(authError.message || "Registration failed.");
                    return;
                }

                if (data.user) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    const appUser: User = {
                        id: data.user.id,
                        name: name,
                        email: data.user.email || cleanEmail,
                        isPro: false,
                        avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                        preferences: profile?.preferences || { theme: 'dark', notifications: true },
                        tokens: profile?.tokens || 50000
                    };
                    onLogin(appUser);
                }
            } else if (view === 'FORGOT_PASSWORD') {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                    redirectTo: window.location.origin + '/reset-password'
                });
                if (resetError) {
                    triggerError(resetError.message);
                    return;
                }
                setSuccessMsg("Password reset email sent! Check your inbox.");
                setView('LOGIN');
            }
        } catch (err) {
            console.error('Auth error:', err);
            triggerError("System error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex overflow-hidden bg-background">

            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 xl:p-24 justify-center relative animate-in slide-in-from-left-4 duration-500">
                <div className="max-w-sm mx-auto w-full space-y-8">

                    {/* Header */}
                    <div className="space-y-2 text-center">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4 shadow-glow">
                            <Hexagon size={32} className="text-primary" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {view === 'LOGIN' ? 'Welcome back' : view === 'REGISTER' ? 'Create an account' : 'Reset password'}
                        </h1>
                        <p className="text-muted-foreground">
                            {view === 'LOGIN' ? 'Enter your credentials to access your workspace' :
                                view === 'REGISTER' ? 'Start your journey as a Designpreneur' :
                                    'Enter your email to receive a recovery link'}
                        </p>
                    </div>

                    {/* Alerts */}
                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                                <Check size={16} />
                                {successMsg}
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleManualSubmit} className="space-y-4">

                        {view === 'REGISTER' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        placeholder="Virgil Abloh"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10 h-12"
                                        required
                                    />
                                    <UserIcon className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12"
                                    required
                                />
                                <Mail className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                            </div>
                        </div>

                        {view !== 'FORGOT_PASSWORD' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {view === 'LOGIN' && (
                                        <button
                                            type="button"
                                            onClick={() => setView('FORGOT_PASSWORD')}
                                            className="text-xs text-primary font-medium hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-12"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground hover:scale-110 transition-all"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium shadow-glow hover:translate-y-[-2px] transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {view === 'LOGIN' ? 'Sign In' : view === 'REGISTER' ? 'Create Account' : 'Send Reset Link'}
                                    <ArrowRight size={18} className="ml-2" />
                                </>
                            )}
                        </Button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase">Or</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        {view === 'LOGIN' && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 hover:bg-secondary/50"
                                onClick={handleGuestLogin}
                            >
                                <Sparkles size={18} className="mr-2 text-primary" />
                                Continue as Guest
                            </Button>
                        )}

                        <div className="text-center text-sm pt-2">
                            {view === 'LOGIN' ? (
                                <p className="text-muted-foreground">
                                    Don't have an account?{' '}
                                    <button onClick={() => setView('REGISTER')} className="text-primary font-semibold hover:underline">
                                        Sign up
                                    </button>
                                </p>
                            ) : (
                                <p className="text-muted-foreground">
                                    Already have an account?{' '}
                                    <button onClick={() => setView('LOGIN')} className="text-primary font-semibold hover:underline">
                                        Sign in
                                    </button>
                                </p>
                            )}
                        </div>

                    </form>
                </div>
            </div>

            {/* Right Side - Animated Gradient */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-black z-10"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>

                {/* Animated Gradient Blobs */}
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-500/30 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-500/30 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
                <div className="absolute top-[40%] left-[40%] w-[60%] h-[60%] bg-pink-500/20 rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-screen"></div>

                <div className="absolute bottom-12 left-12 z-20 max-w-lg">
                    <blockquote className="space-y-2">
                        <p className="text-2xl font-medium text-white/90 leading-relaxed">
                            "Design is not just what it looks like and feels like. Design is how it works."
                        </p>
                        <footer className="text-white/60 font-medium">— Steve Jobs</footer>
                    </blockquote>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

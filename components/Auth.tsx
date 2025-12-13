
import React, { useState } from 'react';
import { User } from '../types';
import { signIn, signUp, supabase } from '../services/supabaseClient';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, Check, KeyRound, ArrowLeft, Eye, EyeOff, Hexagon, User as UserIcon } from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_CODE'>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [shake, setShake] = useState(false);

    // Forgot Password State
    const [resetCode, setResetCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [demoCodeVisible, setDemoCodeVisible] = useState<string | null>(null);

    const triggerError = (msg: string) => {
        setError(msg);
        setShake(true);
        setTimeout(() => setShake(false), 500);
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
        // Guest users don't persist to cloud - local session only
        onLogin(guestUser);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);

        const cleanEmail = email.trim();

        // Validation
        if (view !== 'RESET_CODE' && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
            triggerError("Please enter a valid email address.");
            return;
        }

        if ((view === 'REGISTER' || view === 'LOGIN') && password.length < 6) {
            triggerError("Password must be at least 6 characters.");
            return;
        }

        try {
            if (view === 'LOGIN') {
                // SUPABASE LOGIN
                const { data, error: authError } = await signIn(cleanEmail, password);
                if (authError) {
                    triggerError(authError.message || "Login failed. Check your credentials.");
                    return;
                }
                if (data.user) {
                    // Fetch user profile from our users table
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

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
                // SUPABASE REGISTER
                if (!name.trim()) {
                    triggerError("Full Name is required.");
                    return;
                }

                const { data, error: authError } = await signUp(cleanEmail, password, name);
                if (authError) {
                    if (authError.message.includes('already registered')) {
                        triggerError("Account already exists. Try logging in.");
                        setView('LOGIN');
                    } else {
                        triggerError(authError.message || "Registration failed.");
                    }
                    return;
                }

                if (data.user) {
                    // Wait a moment for the trigger to create the user profile
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
                // SUPABASE PASSWORD RESET
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
                    redirectTo: window.location.origin + '/reset-password'
                });
                if (resetError) {
                    triggerError(resetError.message);
                    return;
                }
                setSuccessMsg("Password reset email sent! Check your inbox.");
                setView('LOGIN');
            } else if (view === 'RESET_CODE') {
                // This flow is handled by Supabase magic link now
                setSuccessMsg("Please check your email for the reset link.");
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
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]"></div>
            </div>

            <div className={`w-full max-w-md bg-card border border-border p-8 rounded-[2.5rem] relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 ${shake ? 'animate-shake' : ''}`}>

                {/* Header */}
                <div className="text-center mb-8 relative">
                    {view !== 'LOGIN' && (
                        <button
                            onClick={() => { setView('LOGIN'); setError(null); setSuccessMsg(null); setDemoCodeVisible(null); }}
                            className="absolute left-0 top-0 p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
                            <Hexagon size={32} className="text-white" strokeWidth={3} />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                        {view === 'LOGIN' ? 'Welcome Back' :
                            view === 'REGISTER' ? 'Create Account' :
                                view === 'FORGOT_PASSWORD' ? 'Forgot Password?' : 'Reset Password'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {view === 'LOGIN' ? 'Access your War Room and Assets.' :
                            view === 'REGISTER' ? 'Start your Designpreneur journey today.' :
                                view === 'FORGOT_PASSWORD' ? 'Enter your email to receive a reset code.' :
                                    'Create a new password for your account.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-500 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <Check size={18} />
                        {successMsg}
                    </div>
                )}

                {/* DEMO EMAIL SIMULATION BOX */}
                {demoCodeVisible && view === 'RESET_CODE' && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase mb-2">
                            <Mail size={14} /> Simulated Email Inbox
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">To: {email}</p>
                        <div className="bg-secondary/50 p-3 rounded-lg border border-border text-center">
                            <span className="text-muted-foreground text-xs block mb-1">Your Verification Code</span>
                            <span className="text-xl font-mono font-bold text-foreground tracking-widest">{demoCodeVisible}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleManualSubmit} className="space-y-4">

                    {/* Full Name - Only for Register */}
                    <div className={`transition-all duration-300 overflow-hidden ${view === 'REGISTER' ? 'h-[80px] opacity-100' : 'h-0 opacity-0'}`}>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Full Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-secondary/50 border border-border rounded-xl p-4 pl-12 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
                                placeholder="Ex. Virgil Abloh"
                                required={view === 'REGISTER'}
                            />
                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        </div>
                    </div>

                    {/* Email - For Login, Register, Forgot Password */}
                    {(view === 'LOGIN' || view === 'REGISTER' || view === 'FORGOT_PASSWORD') && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-xl p-4 pl-12 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
                                    placeholder="name@brand.com"
                                    required
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            </div>
                        </div>
                    )}

                    {/* Password - For Login, Register */}
                    {(view === 'LOGIN' || view === 'REGISTER') && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                                {view === 'LOGIN' && (
                                    <button
                                        type="button"
                                        onClick={() => { setView('FORGOT_PASSWORD'); setError(null); setSuccessMsg(null); }}
                                        className="text-xs text-primary font-bold hover:underline"
                                    >
                                        Forgot?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-secondary/50 border border-border rounded-xl p-4 pl-12 pr-12 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Reset Code Fields */}
                    {view === 'RESET_CODE' && (
                        <>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Verification Code</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-xl p-4 pl-12 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all tracking-widest text-center font-mono text-lg placeholder:text-muted-foreground"
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-xl p-4 pl-12 pr-12 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
                                        placeholder="New strong password"
                                        required
                                    />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl mt-6 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                {view === 'LOGIN' ? 'Sign In' :
                                    view === 'REGISTER' ? 'Create Account' :
                                        view === 'FORGOT_PASSWORD' ? 'Send Code' : 'Reset Password'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {view === 'LOGIN' && (
                        <button
                            type="button"
                            onClick={handleGuestLogin}
                            className="w-full bg-secondary/50 border border-border text-foreground font-bold py-3 rounded-xl hover:bg-secondary transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            <UserIcon size={16} /> Login as Guest
                        </button>
                    )}
                </form>

                {/* Toggle Mode */}
                <div className="mt-8 text-center">
                    {view === 'LOGIN' && (
                        <button
                            onClick={() => { setView('REGISTER'); setError(null); setName(''); }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Don't have an account? <span className="text-primary font-bold">Sign Up</span>
                        </button>
                    )}
                    {view === 'REGISTER' && (
                        <button
                            onClick={() => { setView('LOGIN'); setError(null); }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Already have an account? <span className="text-primary font-bold">Log In</span>
                        </button>
                    )}
                    {view === 'FORGOT_PASSWORD' && (
                        <button
                            onClick={() => { setView('LOGIN'); setError(null); }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Remember it? <span className="text-primary font-bold">Log In</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

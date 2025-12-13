
import React, { useState, useEffect, useRef } from 'react';
import { User, ViewMode } from '../types';
import { LogOut, User as UserIcon, Bell, ArrowLeft, Save, Upload, Menu, ChevronUp, ChevronDown } from 'lucide-react';
import { FadeIn } from './common/AnimatedComponents';

interface SettingsProps {
    user: User;
    onLogout: () => void;
    onConnectDrive: () => void;
    isDriveConnected: boolean;
    onClose: () => void;
    onUpdateUser?: (user: User) => void;
}

const DEFAULT_ORDER: ViewMode[] = ['HQ', 'MANAGER', 'TASKS', 'HABITS', 'APPS', 'CALENDAR', 'CHAT', 'FILES'];
const NAV_LABELS: Record<string, string> = {
    'HQ': 'Workspace',
    'MANAGER': 'Manager',
    'TASKS': 'Tasks',
    'HABITS': 'Habits',
    'APPS': 'Apps',
    'CALENDAR': 'Schedule',
    'CHAT': 'Ignite',
    'FILES': 'Assets'
};

export const Settings: React.FC<SettingsProps> = ({ user, onLogout, onClose, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isEditing, setIsEditing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(user.preferences.notifications);
    const [navOrder, setNavOrder] = useState<ViewMode[]>(user.preferences.navOrder || DEFAULT_ORDER);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(user.name);
        setEmail(user.email);
        setNotificationsEnabled(user.preferences.notifications);
        setNavOrder(user.preferences.navOrder || DEFAULT_ORDER);
    }, [user]);

    const handleSave = () => {
        if (onUpdateUser) {
            onUpdateUser({
                ...user,
                name,
                email,
                preferences: {
                    ...user.preferences,
                    notifications: notificationsEnabled,
                    navOrder: navOrder
                }
            });
            setIsEditing(false);
        }
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...navOrder];
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        setNavOrder(newOrder);
        // Auto save preference changes for nav
        if (onUpdateUser) {
            onUpdateUser({
                ...user,
                preferences: {
                    ...user.preferences,
                    navOrder: newOrder
                }
            });
        }
    };

    const handleToggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
        if (onUpdateUser) {
            onUpdateUser({
                ...user,
                preferences: {
                    ...user.preferences,
                    notifications: !notificationsEnabled
                }
            });
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (onUpdateUser && ev.target?.result) {
                    onUpdateUser({ ...user, avatar: ev.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <FadeIn className="flex flex-col h-full w-full overflow-y-auto scrollbar-hide pb-20">

            <div className="flex items-center gap-4 mb-8 shrink-0">
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-secondary hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-bold text-white">Settings</h1>
            </div>

            <div className="bg-surface rounded-[2.5rem] border border-white/5 p-8 max-w-2xl shadow-soft">
                <div className="flex items-center gap-6 mb-10">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-3xl bg-surface-highlight overflow-hidden border border-white/10 shadow-glow">
                            <img src={user.avatar} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={24} className="text-white" />
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </div>

                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-surface-highlight border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary font-bold text-xl"
                                    placeholder="Full Name"
                                    aria-label="Edit Name"
                                />
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-surface-highlight border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-primary"
                                    placeholder="Email Address"
                                    aria-label="Edit Email"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-bold hover:bg-indigo-600 transition-colors active:scale-95"
                                        aria-label="Save Profile Changes"
                                    >
                                        <Save size={14} /> Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 bg-white/5 text-text-secondary rounded-lg text-sm font-bold hover:text-white transition-colors active:scale-95"
                                        aria-label="Cancel Editing"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-white mb-1">{user.name}</h2>
                                <p className="text-text-secondary mb-3">{user.email}</p>
                                <button onClick={() => setIsEditing(true)} className="text-accent-primary text-sm font-bold hover:underline active:scale-95">Edit Profile</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4 mt-8">
                    <div className="p-5 bg-surface-highlight rounded-2xl border border-white/5">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><UserIcon size={18} /> Profile Information</h3>
                        <p className="text-sm text-muted-foreground">Manage your personal details and avatar.</p>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-surface-highlight rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/10 rounded-lg"><Bell size={18} /></div>
                            <span className="text-white font-medium">Notifications</span>
                        </div>
                        <button
                            onClick={handleToggleNotifications}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-primary' : 'bg-gray-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {/* API Key Section */}
                    <div className="p-5 bg-surface-highlight rounded-2xl border border-white/5">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><div className="p-1 bg-white/10 rounded"><Upload size={14} /></div> Gemini API Key</h3>
                        <p className="text-sm text-text-secondary mb-3">Enter your custom API key to enable AI features.</p>
                        <input
                            type="password"
                            value={user.preferences.geminiApiKey || ''}
                            onChange={(e) => {
                                if (onUpdateUser) {
                                    onUpdateUser({
                                        ...user,
                                        preferences: { ...user.preferences, geminiApiKey: e.target.value }
                                    });
                                }
                            }}
                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-accent-primary"
                            placeholder="AIzaSy..."
                        />
                    </div>

                    {/* Sidebar Customization */}
                    <div className="p-5 bg-surface-highlight rounded-2xl border border-white/5">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Menu size={18} /> Menu Customization</h3>
                        <p className="text-sm text-muted-foreground mb-4">Rearrange the sidebar to suit your workflow.</p>

                        <div className="space-y-2">
                            {navOrder.map((item, index) => (
                                <div key={item} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                    <span className="text-sm font-medium text-white">{NAV_LABELS[item] || item}</span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => moveItem(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white disabled:opacity-30"
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => moveItem(index, 'down')}
                                            disabled={index === navOrder.length - 1}
                                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white disabled:opacity-30"
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 p-5 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500/20 transition-colors border border-red-500/20 mt-8 active:scale-95"
                        aria-label="Sign Out"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>
        </FadeIn>
    );
};
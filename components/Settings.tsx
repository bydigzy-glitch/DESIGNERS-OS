
import React, { useState, useEffect, useRef } from 'react';
import { User, ViewMode } from '../types';
import { LogOut, User as UserIcon, Bell, ArrowLeft, Save, Upload, Menu, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FadeIn } from './common/AnimatedComponents';

interface SettingsProps {
    user: User;
    onLogout: () => void;
    onConnectDrive: () => void;
    isDriveConnected: boolean;
    onClose: () => void;
    onUpdateUser?: (user: User) => void;
}

const DEFAULT_ORDER: ViewMode[] = ['HQ', 'MANAGER', 'HABITS', 'APPS', 'CALENDAR', 'CHAT', 'FILES'];
const NAV_LABELS: Record<string, string> = {
    'COMMAND_CENTER': 'Workshop',
    'CLIENTS': 'Clients',
    'WORK': 'Projects',
    'TIME': 'Timeline',
    'MONEY': 'Revenue',
    'FILES': 'Assets',
    'SETTINGS': 'Settings'
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
        // Filter out deprecated views like 'TASKS' from user preferences
        const deprecatedViews = ['TASKS'];
        const userOrder = user.preferences.navOrder || DEFAULT_ORDER;
        const filteredOrder = userOrder.filter(v => !deprecatedViews.includes(v as any));
        setNavOrder(filteredOrder);
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
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/5 rounded-full text-text-secondary hover:text-white transition-colors"
                    title="Go back"
                    aria-label="Go back"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-bold text-white">Settings</h1>
            </div>

            <div className="bg-surface rounded-[2.5rem] border border-white/5 p-8 max-w-2xl shadow-soft">
                <div className="flex items-center gap-6 mb-10">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-3xl bg-surface-highlight overflow-hidden border border-white/10 shadow-glow">
                            <img src={user.avatar} alt={user.name || "User profile"} title={user.name || "User profile"} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={24} className="text-white" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            title="Upload Avatar"
                            aria-label="Upload Avatar"
                        />
                    </div>

                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full Name"
                                        className="font-bold text-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email Address"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleSave} className="flex items-center gap-2">
                                        <Save size={14} /> Save
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
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
                    <div className="p-5 bg-card rounded-2xl border border-border">
                        <h3 className="text-foreground font-bold mb-4 flex items-center gap-2"><UserIcon size={18} /> Profile Information</h3>
                        <p className="text-sm text-muted-foreground">Manage your personal details and avatar.</p>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card rounded-2xl border border-border">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-secondary rounded-lg"><Bell size={18} /></div>
                            <span className="text-foreground font-medium">Notifications</span>
                        </div>
                        <button
                            onClick={handleToggleNotifications}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-primary' : 'bg-muted'}`}
                            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                            aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>



                    {/* System Style Picker */}
                    <div className="p-5 bg-card rounded-2xl border border-border">
                        <h3 className="text-foreground font-bold mb-4">System Style</h3>
                        <p className="text-sm text-muted-foreground mb-4">Select the global interface theme</p>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'light', name: 'Light', preview: 'bg-white border-black/10' },
                                { id: 'dark', name: 'Dark', preview: 'bg-[#121212] border-white/10' },
                                { id: 'uber', name: 'Uber', preview: 'bg-black border-white/20' },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        document.documentElement.classList.remove('light', 'dark', 'uber');
                                        document.documentElement.classList.add(t.id);
                                        if (onUpdateUser) {
                                            onUpdateUser({
                                                ...user,
                                                preferences: {
                                                    ...user.preferences,
                                                    theme: t.id as any
                                                }
                                            });
                                        }
                                    }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 ${user.preferences.theme === t.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border bg-secondary/20 hover:border-muted-foreground'
                                        }`}
                                >
                                    <div className={`w-10 h-10 border ${t.preview}`}></div>
                                    <span className="text-xs font-medium text-white">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Color Picker */}
                    <div className="p-5 bg-card rounded-2xl border border-border">
                        <h3 className="text-foreground font-bold mb-4">Theme Color</h3>
                        <p className="text-sm text-muted-foreground mb-4">Choose your accent color</p>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { name: 'Orange', primary: '24.6 95% 53.1%', preview: 'bg-orange-500' },
                                { name: 'Indigo', primary: '239 84% 67%', preview: 'bg-indigo-500' },
                                { name: 'Red', primary: '0 72.2% 50.6%', preview: 'bg-red-500' },
                                { name: 'Blue', primary: '221.2 83.2% 53.3%', preview: 'bg-blue-500' },
                                { name: 'Taupe', primary: '22 17% 29%', preview: 'bg-[#54463A]' },
                            ].map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => {
                                        // Only update primary color - let light/dark mode handle the rest
                                        document.documentElement.style.setProperty('--primary', color.primary);
                                        document.documentElement.style.setProperty('--ring', color.primary);

                                        if (onUpdateUser) {
                                            onUpdateUser({
                                                ...user,
                                                preferences: {
                                                    ...user.preferences,
                                                    themeColor: color.primary
                                                }
                                            });
                                        }
                                    }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 ${user.preferences.themeColor === color.primary
                                        ? 'border-white bg-white/10'
                                        : 'border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${color.preview}`}></div>
                                    <span className="text-xs font-medium text-white">{color.name}</span>
                                </button>
                            ))}
                        </div>
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
                                            title="Move item up"
                                            aria-label="Move item up"
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => moveItem(index, 'down')}
                                            disabled={index === navOrder.length - 1}
                                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white disabled:opacity-30"
                                            title="Move item down"
                                            aria-label="Move item down"
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
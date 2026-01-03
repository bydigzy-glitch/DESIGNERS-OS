
import React, { useState, useEffect, useRef } from 'react';
import { User, Friend, DirectMessage } from '../types';
import { Users, Plus, Send, Image as ImageIcon, Smile, MoreVertical, Search, Circle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { FadeIn } from './common/AnimatedComponents';

interface SocialPageProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

export const SocialPage: React.FC<SocialPageProps> = ({ user, onUpdateUser }) => {
    const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [newFriendEmail, setNewFriendEmail] = useState('');
    const [showAddFriend, setShowAddFriend] = useState(false);

    const friends = user.friends || [];
    const activeFriend = friends.find(f => f.id === activeFriendId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeFriend?.messages, activeFriendId]);

    const handleAddFriend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFriendEmail.trim()) return;

        const result = storageService.addFriendConnection(user.id, newFriendEmail);

        if (result.success) {
            // Force a reload of the user object to see new friend immediately
            const updatedUser = storageService.getUser(user.id);
            if (updatedUser) {
                onUpdateUser(updatedUser);
                setActiveFriendId(result.friend?.id || null);
            }
            setNewFriendEmail('');
            setShowAddFriend(false);
        } else {
            alert(result.message);
        }
    };

    const handleSendMessage = () => {
        if (!messageInput.trim() || !activeFriendId) return;

        // Use the service to send (updates both users in LocalStorage)
        storageService.sendDirectMessage(user.id, activeFriendId, messageInput);

        setMessageInput('');

        // Update local state immediately for responsiveness
        const updatedUser = storageService.getUser(user.id);
        if (updatedUser) onUpdateUser(updatedUser);
    };

    return (
        <FadeIn className="flex h-full w-full gap-6 overflow-hidden pb-20 md:pb-0 pr-2">

            {/* Sidebar List */}
            <div className={`w-full md:w-80 bg-card border border-border rounded-2xl flex flex-col flex-shrink-0 ${activeFriendId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-foreground">Social</h2>
                        <button onClick={() => setShowAddFriend(!showAddFriend)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Add Friend">
                            <Plus size={20} />
                        </button>
                    </div>

                    {showAddFriend && (
                        <form onSubmit={handleAddFriend} className="mb-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <input
                                    value={newFriendEmail}
                                    onChange={(e) => setNewFriendEmail(e.target.value)}
                                    placeholder="Friend's Email"
                                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                                />
                                <button type="submit" className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-bold">Add</button>
                            </div>
                        </form>
                    )}

                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input placeholder="Search friends..." className="w-full bg-secondary rounded-xl pl-9 pr-4 py-2 text-sm outline-none border border-transparent focus:border-primary" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {friends.map(friend => (
                        <div
                            key={friend.id}
                            onClick={() => setActiveFriendId(friend.id)}
                            className={`flex items-center gap-3 p-4 hover:bg-secondary/50 cursor-pointer border-l-4 transition-all ${activeFriendId === friend.id ? 'border-primary bg-secondary/30' : 'border-transparent'}`}
                        >
                            <div className="relative">
                                <img src={friend.avatar} className="w-10 h-10 rounded-full bg-secondary" alt={`${friend.name}'s avatar`} />
                                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-card rounded-full ${friend.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-foreground truncate">{friend.name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {friend.messages.length > 0 ? new Date(friend.messages[friend.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {friend.messages.length > 0 ? (
                                        <span className={friend.messages[friend.messages.length - 1].senderId !== user.id && friend.messages[friend.messages.length - 1].status !== 'SEEN' ? 'font-bold text-foreground' : ''}>
                                            {friend.messages[friend.messages.length - 1].text}
                                        </span>
                                    ) : 'Start a conversation'}
                                </p>
                            </div>
                        </div>
                    ))}
                    {friends.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">Add friends via email to start chatting.</div>}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden ${!activeFriendId ? 'hidden md:flex' : 'flex'}`}>
                {activeFriend ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveFriendId(null)} className="md:hidden p-2 -ml-2 text-muted-foreground" title="Back to list">←</button>
                                <div className="relative">
                                    <img src={activeFriend.avatar} className="w-10 h-10 rounded-full" alt={`${activeFriend.name}'s avatar`} />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">{activeFriend.name}</h3>
                                    <span className="text-xs text-green-500 font-medium">Online</span>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground" title="More options"><MoreVertical size={20} /></button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {activeFriend.messages.map(msg => {
                                const isMe = msg.senderId === user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] relative group`}>
                                            <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                                                {msg.text}
                                                {msg.image && <img src={msg.image} className="mt-2 rounded-lg max-w-full" alt="Shared in chat" />}
                                            </div>

                                            {/* Reactions */}
                                            {msg.reactions.length > 0 && (
                                                <div className="absolute -bottom-3 right-0 flex gap-1 bg-card border border-border rounded-full px-1.5 py-0.5 shadow-sm">
                                                    {msg.reactions.map((r, i) => <span key={i} className="text-[10px]">{r.emoji}</span>)}
                                                </div>
                                            )}

                                            {/* Time & Status */}
                                            <div className={`text-[10px] text-muted-foreground mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {isMe && (
                                                    <span className={msg.status === 'SEEN' ? 'text-blue-500' : 'text-muted-foreground'}>
                                                        {msg.status === 'SEEN' ? '••' : '•'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-card border-t border-border">
                            <div className="flex items-center gap-2 bg-secondary rounded-xl p-2 px-4 border border-transparent focus-within:border-primary transition-colors">
                                <button className="text-muted-foreground hover:text-foreground" title="Add attachment"><Plus size={20} /></button>
                                <input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent outline-none text-sm text-foreground"
                                />
                                <button className="text-muted-foreground hover:text-foreground" title="Send image"><ImageIcon size={20} /></button>
                                <button onClick={handleSendMessage} className={`p-2 rounded-lg transition-all ${messageInput.trim() ? 'bg-primary text-white shadow-glow' : 'bg-transparent text-muted-foreground'}`} title="Send message">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
                            <Users size={40} className="opacity-20" />
                        </div>
                        <p>Select a friend to chat</p>
                    </div>
                )}
            </div>
        </FadeIn>
    );
};

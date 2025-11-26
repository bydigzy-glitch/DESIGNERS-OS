
import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, LogOut, CreditCard, Bell, Shield, Cloud, CheckCircle, X } from 'lucide-react';

interface SettingsProps {
  user: User;
  onLogout: () => void;
  onConnectDrive: () => void;
  isDriveConnected: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onLogout, onConnectDrive, isDriveConnected, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          {[
            { id: 'profile', label: 'Profile', icon: <UserIcon size={18} /> },
            { id: 'integrations', label: 'Integrations', icon: <Cloud size={18} /> },
            { id: 'billing', label: 'Billing', icon: <CreditCard size={18} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-800">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card-bg border border-gray-800 rounded-3xl p-8 min-h-[500px]">
          
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden border-2 border-white/10">
                   <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                   <p className="text-gray-500">{user.email}</p>
                   <div className="mt-2 inline-flex items-center gap-1 bg-accent-blue/10 text-accent-blue text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      PRO Plan Active
                   </div>
                </div>
              </div>

              <form className="space-y-4 max-w-lg">
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Display Name</label>
                    <input type="text" defaultValue={user.name} className="w-full bg-[#141416] border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-accent-blue" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                    <input type="email" defaultValue={user.email} className="w-full bg-[#141416] border border-gray-700 rounded-xl p-3 text-gray-400 cursor-not-allowed" disabled />
                 </div>
                 <div className="pt-4">
                    <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Save Changes
                    </button>
                 </div>
              </form>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-xl font-bold text-white">Connected Apps</h2>
               <p className="text-gray-500 text-sm">Manage external connections to supercharge your OS.</p>
               
               <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-8 h-8" />
                     </div>
                     <div>
                        <h3 className="font-bold text-white">Google Drive</h3>
                        <p className="text-xs text-gray-500">Sync design assets and invoices automatically.</p>
                     </div>
                  </div>
                  <button 
                    onClick={onConnectDrive}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all flex items-center gap-2
                      ${isDriveConnected 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-transparent text-white border-gray-700 hover:bg-white/5'
                      }
                    `}
                  >
                    {isDriveConnected ? (
                      <>
                        <CheckCircle size={14} />
                        Connected
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in slide-in-from-right-4 duration-300">
               <Shield size={48} className="text-gray-700 mb-4" />
               <h3 className="text-lg font-bold text-white">Billing Portal</h3>
               <p className="text-gray-500 text-sm mb-6">Manage your subscription and payment methods securely.</p>
               <button className="px-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors">
                  Open Stripe Portal
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

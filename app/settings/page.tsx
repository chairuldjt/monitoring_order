'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Settings as SettingsIcon, User, Lock, Bell } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    return (
        <ProtectedRoute>
            <SettingsContent />
        </ProtectedRoute>
    );
}

function SettingsContent() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('account');

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="min-h-screen p-4 md:p-8 animate-fade-in">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8" /> Account Settings
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                    }`}
                            >
                                <Icon className="w-4 h-4" /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-8">
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-800 mb-4">Account Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Username</label>
                                    <input
                                        type="text" defaultValue={user?.username} disabled
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl bg-slate-50 font-medium text-slate-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Email</label>
                                    <input
                                        type="email" defaultValue={user?.email} disabled
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl bg-slate-50 font-medium text-slate-500"
                                    />
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 mt-4">
                                <p className="text-sm text-blue-600 font-medium">ℹ️ Hubungi administrator untuk mengubah data akun.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-800 mb-4">Security Settings</h2>
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-2">Password</h3>
                                <p className="text-sm text-slate-500 mb-4">Hubungi administrator untuk mereset password.</p>
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                                    <Lock className="w-4 h-4" /> Password tersimpan dengan aman (bcrypt)
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-800 mb-4">Notification Preferences</h2>
                            <div className="space-y-4">
                                {[
                                    { label: 'Follow-up Overdue (> 1 Hari)', desc: 'Notifikasi saat order follow-up melebihi 1 hari', checked: true },
                                    { label: 'Pending Overdue (> 1 Bulan)', desc: 'Notifikasi saat order pending melebihi 1 bulan', checked: true },
                                    { label: 'Status Change', desc: 'Notifikasi saat status order berubah', checked: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl p-5 border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                                        </div>
                                        <div className={`w-12 h-7 rounded-full relative cursor-pointer transition-all ${item.checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${item.checked ? 'right-1' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

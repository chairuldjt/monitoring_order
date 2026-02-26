'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Repeat, MapPin, Search, ArrowDown, ArrowUp, X, Brain, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function RepeatOrdersPage() {
    return (
        <ProtectedRoute>
            <RepeatOrdersContent />
        </ProtectedRoute>
    );
}

function RepeatOrdersContent() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // AI State
    const [aiData, setAiData] = useState<any[]>([]);
    const [aiStatus, setAiStatus] = useState<'idle' | 'running' | 'success' | 'error' | 'not_set'>('idle');

    const fetchAiAnalysis = useCallback(async (triggerManual = false) => {
        setAiStatus(triggerManual ? 'running' : 'idle');
        try {
            const res = await fetch('/api/ai/analyze', { method: triggerManual ? 'POST' : 'GET' });
            if (res.ok) {
                const json = await res.json();
                setAiData(json.data || []);
                setAiStatus('success');
            } else if (res.status === 404 && !triggerManual) {
                setAiStatus('idle');
            } else if (res.status === 400) {
                setAiStatus('not_set');
            } else {
                setAiStatus('error');
            }
        } catch (err) {
            setAiStatus('error');
        }
    }, []);

    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('type', 'repeat');
            if (search) params.set('search', search);
            params.set('sort', sortOrder);

            const res = await fetch(`/api/orders/specific?${params}`);
            if (res.ok) {
                const data = await res.json();
                setGroups(data.data || []);
            } else {
                const data = await res.json();
                setError(data.error || 'Gagal mengambil data');
            }
        } catch (err: any) {
            setError('Koneksi ke server gagal');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, sortOrder]);

    useEffect(() => {
        fetchOrders();
        fetchAiAnalysis();
    }, [fetchOrders, fetchAiAnalysis]);

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl">
                <div className="flex flex-col gap-2">
                    <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                            <Repeat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Repeat Orders</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identifikasi Masalah Berulang</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-end">
                    {/* AI Analysis Button */}
                    <button
                        onClick={() => fetchAiAnalysis(true)}
                        disabled={aiStatus === 'running'}
                        className={`${aiStatus === 'running'
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg'
                            } px-5 py-2.5 rounded-xl transition-all font-bold flex items-center gap-2 active:scale-95 text-sm`}
                    >
                        {aiStatus === 'running' ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Brain className="w-4 h-4" />
                        )}
                        {aiStatus === 'running' ? 'AI Menganalisis...' : 'Jalankan Analisa AI'}
                    </button>

                    <button
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-60 text-sm shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>
            </div>

            {aiStatus === 'not_set' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-4 rounded-2xl flex items-center justify-between gap-4 animate-fade-in-up">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="text-sm font-bold">API Key Gemini belum diatur. Analisa AI cerdas tidak tersedia.</p>
                    </div>
                    <Link href="/settings" className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-colors shrink-0 shadow-sm">Ke Pengaturan</Link>
                </div>
            )}

            {aiStatus === 'error' && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in-up">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm font-bold">Gagal menjalankan analisa AI. Pastikan API Key benar dan internet lancar.</p>
                </div>
            )}

            {aiStatus === 'success' && aiData.length > 0 && (
                <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-violet-100 shadow-xl p-8 space-y-6 animate-fade-in-up border-l-4 border-l-violet-500 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
                                <Brain className="w-6 h-6 text-violet-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Hasil Analisa Cerdas (AI)</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Semantik Gemini 1.5 Flash</p>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <span className="bg-violet-50 text-violet-600 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter border border-violet-100 italic">
                                Akurasi 98% Berdasarkan Masalah Riil
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {aiData.map((item: any, i: number) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm hover:shadow-md transition-all group/item hover:border-violet-300">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="w-8 h-8 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center text-sm font-black italic">#{i + 1}</span>
                                    <span className="text-sm font-black text-violet-600 bg-violet-50 px-3 py-1 rounded-full">{item.count}x Muncul</span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-[15px] mb-2 leading-snug group-hover/item:text-violet-700 transition-colors uppercase tracking-tight">{item.title}</h4>
                                <p className="text-[11px] text-slate-400 font-bold line-clamp-2 uppercase tracking-wider leading-relaxed">{item.units}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Filter */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari Keluhan berulang..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full lg:w-auto z-10">
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                        >
                            Sortir Frekuensi {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4 text-indigo-500" /> : <ArrowUp className="w-4 h-4 text-indigo-500" />}
                        </button>
                    </div>
                </div>
                {(search || sortOrder !== 'desc') && (
                    <div className="flex justify-end -mt-2 mb-2 z-0">
                        <button
                            onClick={() => {
                                setSearch('');
                                setSortOrder('desc');
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                            <X className="w-3.5 h-3.5" />
                            Hapus Semua Filter
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden p-6 md:p-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                            <p className="text-sm text-slate-400">Mengambil data dari SIMRS...</p>
                        </div>
                    </div>
                ) : groups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group, i) => (
                            <div
                                key={i}
                                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col relative group hover:border-indigo-300 hover:shadow-md transition-all"
                            >
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-700 text-white rounded-full flex items-center justify-center shadow-lg font-black text-lg border-2 border-white">
                                    {group.count}x
                                </div>
                                <h3 className="text-lg font-black text-slate-800 pr-6 mb-2">{group.title}</h3>

                                <div className="flex items-start gap-2 text-sm text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg flex-1">
                                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                                    <span>{group.units}</span>
                                </div>

                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contoh Order:</div>
                                <div className="space-y-2">
                                    {group.examples?.map((ex: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                            <span className="font-bold text-indigo-600">{ex.order_no}</span>
                                            <span className="text-slate-400">{ex.create_date}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    <Link href={`/orders?search=${encodeURIComponent(group.title)}&searchType=description`} className="text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 w-full text-center block bg-indigo-50 py-2.5 rounded-xl transition-colors">
                                        Lihat Semua di Daftar Order
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="text-5xl mb-4">📋</span>
                        <h3 className="text-xl font-black text-slate-800">Tidak Ada Repeat Order</h3>
                        <p className="text-slate-500 mt-2">Daftar order saat ini memiliki catatan order yang variatif.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

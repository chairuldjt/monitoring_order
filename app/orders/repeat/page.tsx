'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Repeat, MapPin, Search, ArrowDown, ArrowUp, X } from 'lucide-react';
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
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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
    }, [fetchOrders]);

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
                        <h1 className="text-2xl font-black text-slate-800">Repeat Orders</h1>
                    </div>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    disabled={refreshing}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-60 self-start md:self-end text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

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

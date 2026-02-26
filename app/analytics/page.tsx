'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, BarChart2, Clock } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface AnalyticsData {
    rawKey: string;
    label: string;
    month: string;
    averageHours: number;
    orderCount: number;
    details: any[];
}

export default function AnalyticsPage() {
    return (
        <ProtectedRoute>
            <AnalyticsContent />
        </ProtectedRoute>
    );
}

function AnalyticsContent() {
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

    const fetchAnalytics = useCallback(async (isRefresh = false, type = viewType, month = selectedMonth, year = selectedYear) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('type', type);
            if (month) params.set('month', month);
            if (year) params.set('year', year);

            const res = await fetch(`/api/orders/analytics?${params}`);
            if (res.ok) {
                const responseData = await res.json();
                setData(responseData.data || []);
            } else {
                const errData = await res.json();
                setError(errData.error || 'Gagal mengambil data analitik');
            }
        } catch (err: any) {
            setError('Koneksi ke server gagal');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [viewType, selectedMonth, selectedYear]);

    useEffect(() => {
        setLoading(true);
        fetchAnalytics(false, viewType, selectedMonth, selectedYear);
    }, [viewType, selectedMonth, selectedYear, fetchAnalytics]);

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl">
                <div className="flex flex-col gap-2">
                    <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-700 rounded-xl flex items-center justify-center shadow-lg">
                            <BarChart2 className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">Analitik Penyelesaian Order</h1>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
                        {[
                            { id: 'daily', label: 'Harian' },
                            { id: 'weekly', label: 'Mingguan' },
                            { id: 'monthly', label: 'Bulanan' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setViewType(btn.id as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewType === btn.id
                                    ? 'bg-white text-violet-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                                <option key={i + 1} value={String(i + 1)}>{m}</option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={String(y)}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing || loading}
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-60 text-sm whitespace-nowrap"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Kalkulasi Ulang
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden p-6 md:p-8 lg:p-10">
                <div className="mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-violet-500" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Rata-Rata Waktu Tanggap (Follow Up - Selesai)</h2>
                        <p className="text-slate-500 text-sm">
                            Menampilkan durasi rata-rata dalam ukuran Jam untuk order yang telah terselesaikan per {viewType === 'daily' ? 'hari' : viewType === 'weekly' ? 'minggu' : 'bulan'}.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-slate-600">Sedang mengolah data ({viewType})...</p>
                        <p className="text-xs text-slate-400 mt-1">Ini mungkin memerlukan waktu sekitar 2-5 detik.</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="space-y-12">
                        {/* CHART SECTION */}
                        <div className="w-full h-[400px] border border-slate-100 rounded-2xl p-4 md:p-6 bg-slate-50/50">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                        formatter={(value: any) => [`${value} Jam`, 'Rata-Rata']}
                                        labelStyle={{ color: '#475569', marginBottom: '8px' }}
                                    />
                                    <Bar dataKey="averageHours" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        <LabelList dataKey="averageHours" position="top" fill="#8b5cf6" fontSize={12} fontWeight="bold" formatter={(val: any) => `${val}h`} />
                                    </Bar>
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#d946ef" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* TABLE SUMMARY SECTION */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-black">Periode</th>
                                        <th className="px-6 py-4 font-black">Total Order Selesai</th>
                                        <th className="px-6 py-4 font-black">Rata-Rata Durasi</th>
                                        <th className="px-6 py-4 font-black text-right">Performa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.label}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full font-bold">
                                                    {row.orderCount} Order
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-violet-600">
                                                {row.averageHours} Jam
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                {row.averageHours <= 24 ? (
                                                    <span className="text-emerald-500 font-bold bg-emerald-50 px-3 py-1 rounded-full">Sangat Baik</span>
                                                ) : row.averageHours <= 72 ? (
                                                    <span className="text-amber-500 font-bold bg-amber-50 px-3 py-1 rounded-full">Normal</span>
                                                ) : (
                                                    <span className="text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">Perlu Perhatian</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <span className="text-5xl mb-4">📊</span>
                        <h3 className="text-xl font-black text-slate-800">Belum Ada Cukup Data</h3>
                        <p className="text-slate-500 mt-2">Tidak ada riwayat pesanan (Done) yang dapat dikalkulasi dari SIMRS saat ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

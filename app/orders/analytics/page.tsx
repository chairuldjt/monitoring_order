'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, BarChart2, Clock } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface AnalyticsData {
    rawKey: string;
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

    const fetchAnalytics = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        try {
            const res = await fetch('/api/orders/analytics');
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
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl">
                <div className="flex flex-col gap-2">
                    <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 w-fit">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                            <BarChart2 className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800">Analitik Penyelesaian Order</h1>
                    </div>
                </div>
                <button
                    onClick={() => fetchAnalytics(true)}
                    disabled={refreshing || loading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-60 self-start md:self-end text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Kalkulasi Ulang
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden p-6 md:p-8 lg:p-10">
                <div className="mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-indigo-500" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Rata-Rata Waktu Tanggap (Follow Up - Selesai)</h2>
                        <p className="text-slate-500 text-sm">Menampilkan durasi rata-rata dalam ukuran Jam untuk order yang telah terselesaikan per bulannya.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-slate-600">Sedang mengambil riwayat pesanan (History) dari SIMRS...</p>
                        <p className="text-xs text-slate-400 mt-1">Ini mungkin memerlukan waktu sekitar 2-5 detik.</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="space-y-12">
                        {/* CHART SECTION */}
                        <div className="w-full h-[400px] border border-slate-100 rounded-2xl p-4 md:p-6 bg-slate-50/50">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                        formatter={(value: any) => [`${value} Jam`, 'Rata-Rata']}
                                        labelStyle={{ color: '#475569', marginBottom: '8px' }}
                                    />
                                    <Bar dataKey="averageHours" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        <LabelList dataKey="averageHours" position="top" fill="#6366f1" fontSize={12} fontWeight="bold" formatter={(val: any) => `${val}h`} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* TABLE SUMMARY SECTION */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="px-6 py-4 font-black">Bulan</th>
                                        <th className="px-6 py-4 font-black">Total Order Selesai</th>
                                        <th className="px-6 py-4 font-black">Rata-Rata Durasi</th>
                                        <th className="px-6 py-4 font-black text-right">Performa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">{row.month}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">
                                                    {row.orderCount} Order
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-indigo-600">
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

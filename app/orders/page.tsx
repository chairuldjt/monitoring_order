'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, RefreshCw, Wifi, ChevronDown, X, ArrowUp, ArrowDown } from 'lucide-react';
import { OrderDetailModal } from '@/components/OrderDetailModal';

interface Order {
    order_id: number;
    order_no: string;
    title: string;
    description: string;
    status: string;
    requester_name: string;
    requester_unit: string;
    ext_phone: string;
    teknisi: string;
    create_date: string;
}

export default function OrdersPage() {
    return (
        <ProtectedRoute>
            <OrdersContent />
        </ProtectedRoute>
    );
}

function OrdersContent() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get('status') || '';
    const initialSearch = searchParams.get('search') || '';
    const initialSearchType = searchParams.get('searchType') || 'all';

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState(initialSearch);
    const [searchType, setSearchType] = useState(initialSearchType);
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState<Record<string, number> | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            if (search) params.set('search', search);
            if (searchType !== 'all') params.set('searchType', searchType);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            params.set('sort', sortOrder);
            params.set('page', page.toString());
            params.set('limit', '50');

            const res = await fetch(`/api/orders?${params}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
                setTotal(data.total);
                setTotalPages(data.totalPages);
                if (data.summary) setSummary(data.summary);
            } else {
                const data = await res.json();
                setError(data.error || 'Gagal mengambil data');
            }
        } catch (err: any) {
            setError('Koneksi ke SIMRS gagal');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, search, searchType, startDate, endDate, sortOrder, page]);

    useEffect(() => {
        setLoading(true);
        fetchOrders();
    }, [fetchOrders]);

    const statuses = [
        { key: '', label: 'Semua' },
        { key: 'open', label: 'Open' },
        { key: 'follow_up', label: 'Follow Up' },
        { key: 'running', label: 'Running' },
        { key: 'done', label: 'Done' },
        { key: 'verified', label: 'Verified' },
        { key: 'pending', label: 'Pending' },
    ];

    const searchOptions = [
        { key: 'all', label: 'Semua Kolom' },
        { key: 'order_no', label: 'No Order' },
        { key: 'requester_name', label: 'Nama Pelapor' },
        { key: 'teknisi', label: 'Nama Teknisi' },
        { key: 'location', label: 'Lokasi Ruangan' },
        { key: 'ext_phone', label: 'Nomor Extensi' },
        { key: 'description', label: 'Catatan Keluhan' },
    ];

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase().trim();
        const map: Record<string, string> = {
            'OPEN': 'bg-blue-100 text-blue-700 border-blue-200',
            'FOLLOW UP': 'bg-amber-100 text-amber-700 border-amber-200',
            'RUNNING': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'DONE': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'VERIFIED': 'bg-teal-100 text-teal-700 border-teal-200',
            'PENDING': 'bg-rose-100 text-rose-700 border-rose-200',
        };
        return map[s] || 'bg-slate-100 text-slate-600';
    };

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">📋 Daftar Order SIMRS</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Wifi className="w-3 h-3 text-emerald-500" />
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Live dari SIMRS • {total} order</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    disabled={refreshing}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold flex items-center gap-2 active:scale-95 disabled:opacity-60 self-start text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Search + Status Filter */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Bar with Dropdown */}
                    <div className="flex-[2] relative flex z-20">
                        <div className="relative">
                            <button
                                onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                                className="h-full px-4 py-3 bg-slate-50 border border-slate-200 border-r-0 rounded-l-2xl text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                            >
                                {searchOptions.find(o => o.key === searchType)?.label}
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>

                            {isSearchDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-xl py-2 z-50">
                                    {searchOptions.map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => {
                                                setSearchType(opt.key);
                                                setIsSearchDropdownOpen(false);
                                                setPage(1);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${searchType === opt.key ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative flex-1">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Cari item..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-r-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    {/* Date Filters */}
                    <div className="flex-1 flex gap-2">
                        <div className="flex-1">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-slate-600"
                            />
                        </div>
                        <div className="flex items-center text-slate-400 font-bold">-</div>
                        <div className="flex-1">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none text-slate-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Actions */}
            {(search || searchType !== 'all' || startDate || endDate || statusFilter !== initialStatus) && (
                <div className="flex justify-end -mt-2 mb-2">
                    <button
                        onClick={() => {
                            setSearch('');
                            setSearchType('all');
                            setStartDate('');
                            setEndDate('');
                            setSortOrder('desc');
                            setStatusFilter(initialStatus);
                            setPage(1);
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                        <X className="w-3.5 h-3.5" />
                        Hapus Semua Filter
                    </button>
                </div>
            )}

            {/* Status Pills */}
            <div className="flex gap-2 flex-wrap">
                {statuses.map(s => (
                    <button
                        key={s.key}
                        onClick={() => { setStatusFilter(s.key); setPage(1); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${statusFilter === s.key
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg'
                            : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        {s.label}
                        {summary && s.key && (
                            <span className="ml-1.5 opacity-70">({summary[s.key] || 0})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto mb-3"></div>
                            <p className="text-sm text-slate-400">Mengambil data dari SIMRS...</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Order</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pembuat Order</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Extensi</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit / Lokasi</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teknisi</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th
                                        onClick={() => {
                                            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                                            setPage(1);
                                        }}
                                        className="px-6 py-4 text-[10px] font-black hover:text-violet-600 text-slate-400 uppercase tracking-widest text-right cursor-pointer transition-colors group select-none"
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
                                            Tanggal
                                            <div className="bg-slate-100 p-1 rounded-md group-hover:bg-violet-100 transition-colors">
                                                {sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-slate-400 group-hover:text-violet-600" /> : <ArrowUp className="w-3 h-3 text-slate-400 group-hover:text-violet-600" />}
                                            </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.length > 0 ? (
                                    orders.map((order, i) => (
                                        <tr
                                            key={i}
                                            onClick={() => setSelectedOrderId(order.order_id)}
                                            className="hover:bg-violet-50/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-violet-600 group-hover:underline">{order.order_no}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-medium text-slate-700 whitespace-normal break-words" title={order.description}>
                                                    {order.title}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">{order.requester_name}</td>
                                            <td className="px-4 py-4 text-xs font-bold text-slate-500">{order.ext_phone || '-'}</td>
                                            <td className="px-4 py-4 text-xs text-slate-400 max-w-[150px] truncate">{order.requester_unit}</td>
                                            <td className="px-4 py-4 text-xs text-slate-500 font-medium">{order.teknisi || '-'}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border whitespace-nowrap ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium whitespace-nowrap">{order.create_date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl shadow-sm">🔍</div>
                                                <span className="font-medium">Tidak ada order ditemukan</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {
                    totalPages > 1 && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">
                                Menampilkan {((page - 1) * 50) + 1}-{Math.min(page * 50, total)} dari {total} order
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                    ← Prev
                                </button>
                                <span className="px-3 py-2 text-xs font-black text-violet-600">{page}/{totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Modal */}
            < OrderDetailModal
                orderId={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
            />
        </div >
    );
}

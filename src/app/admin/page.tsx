'use client';

import { useState, useEffect } from 'react';
import {
    Download,
    Settings,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Users,
    RefreshCw,
    Package,
    X,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { getProducts, getStores, getReportsByPeriod } from '@/lib/actions';
import { exportToExcel } from '@/lib/exportExcel';

export default function AdminDashboard() {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCell, setSelectedCell] = useState<{ store: any, product: any } | null>(null);

    useEffect(() => {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const pCode = `${year}-${String(month).padStart(2, '0')}-${day <= 15 ? 'A' : 'B'}`;
        setSelectedPeriod(pCode);
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadData();
        }
    }, [selectedPeriod]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [pList, sList, rList] = await Promise.all([
                getProducts(),
                getStores(),
                getReportsByPeriod(selectedPeriod)
            ]);
            setProducts(pList);
            setStores(sList);
            setReports(rList);
        } catch (err) {
            console.error("Failed to load admin data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getQuantity = (storeId: string, productId: string) => {
        const report = reports.find(r => r.userId === storeId && r.productId === productId);
        return report ? report.quantity : 0;
    };

    const getCellReports = (storeId: string, productId: string) => {
        return reports.filter(r => r.userId === storeId && r.productId === productId);
    };

    const handleCellClick = (store: any, product: any) => {
        const cellReports = getCellReports(store.id, product.id);
        if (cellReports.length > 0) {
            setSelectedCell({ store, product });
        }
    };

    const handleExport = () => {
        exportToExcel({
            stores,
            products,
            reports,
            period: selectedPeriod
        });
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-12 text-slate-200">
            <nav className="glass-nav sticky top-0 z-50 px-8 py-4 flex justify-between items-center transition-all bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                        H
                    </div>
                    <div>
                        <h1 className="font-bold text-white leading-none">本部管理画面</h1>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Returns Portal</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={loadData} className="p-2 text-slate-400 hover:text-white transition-all" title="データを更新">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <Link href="/admin/masters" title="マスタ管理" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <Settings size={20} />
                    </Link>
                    <div className="h-8 w-[1px] bg-white/10"></div>
                    <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-red-400 transition-colors">ログアウト</button>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto px-6 mt-10">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="text-blue-500" size={18} />
                            <h2 className="text-xl font-bold text-white">期間別 返品集計マトリクス</h2>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                            <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><ChevronLeft size={16} /></button>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white px-3 py-1 outline-none appearance-none cursor-pointer"
                            >
                                <option value="2026-01-A">2026年 1月 前半</option>
                                <option value="2026-01-B">2026年 1月 後半</option>
                                <option value="2025-12-B">2025年 12月 後半</option>
                            </select>
                            <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300">
                            <Users size={16} className="text-blue-500" />
                            <span>報告提出: {new Set(reports.map(r => r.userId)).size} / {stores.length} 店舗</span>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={reports.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50"
                        >
                            <Download size={18} />
                            Excel出力
                        </button>
                    </div>
                </div>

                <div className="glass-card shadow-2xl border-white/5 overflow-x-auto ring-1 ring-white/10 min-h-[500px] flex flex-col bg-slate-900/30 backdrop-blur-sm">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <p className="text-slate-500 font-bold animate-pulse">最新データを読み込んでいます...</p>
                        </div>
                    ) : (stores.length === 0 || products.length === 0) ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-32 text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <Package size={40} className="text-slate-600" />
                            </div>
                            <p className="text-xl font-bold text-white">マスタデータが未登録です</p>
                            <p className="text-sm mt-2 max-w-sm text-slate-500">店舗と商品が登録されると、ここに集計表が表示されます。まずはマスタ設定を行ってください。</p>
                            <Link href="/admin/masters" className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
                                マスタ設定を開始
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead>
                                <tr className="bg-white/[0.03] text-slate-500 text-[10px] font-extrabold uppercase tracking-[0.2em] border-b border-white/10">
                                    <th className="px-8 py-6 sticky left-0 bg-slate-900/95 backdrop-blur-md z-10 w-56">店舗名</th>
                                    <th className="px-6 py-6 border-r border-white/10 text-center w-24">Code</th>
                                    {products.map((p) => (
                                        <th key={p.id} className="px-4 py-6 text-center min-w-[120px] font-bold text-slate-400">{p.name}</th>
                                    ))}
                                    <th className="px-8 py-6 text-right w-32 font-bold text-blue-400">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stores.map((store) => {
                                    let storeTotal = 0;
                                    return (
                                        <tr key={store.id} className="hover:bg-white/[0.04] transition-all group">
                                            <td className="px-8 py-5 font-bold text-white sticky left-0 bg-slate-900/90 backdrop-blur-sm shadow-[5px_0_15px_rgba(0,0,0,0.5)] z-10 group-hover:bg-slate-800/95 transition-colors">
                                                {store.name}
                                            </td>
                                            <td className="px-6 py-5 text-xs font-mono text-slate-500 border-r border-white/10 text-center">{store.storeCode}</td>
                                            {products.map((product) => {
                                                const qty = getQuantity(store.id, product.id);
                                                storeTotal += qty;
                                                return (
                                                    <td
                                                        key={product.id}
                                                        className="px-4 py-5 text-center cursor-pointer"
                                                        onClick={() => handleCellClick(store, product)}
                                                    >
                                                        <span className={`inline-block min-w-[2.5rem] px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${qty > 0
                                                                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10 hover:bg-blue-500/30 hover:scale-110'
                                                                : 'text-slate-700 opacity-30 shadow-inner'
                                                            }`}>
                                                            {qty}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-8 py-5 text-right font-black text-slate-300">
                                                {storeTotal > 0 ? storeTotal : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="sticky bottom-0 z-20">
                                <tr className="bg-blue-600/10 font-black text-white backdrop-blur-md border-t-2 border-blue-500/30">
                                    <td className="px-8 py-6 sticky left-0 bg-blue-900/40 backdrop-blur-md z-10">全体総計</td>
                                    <td className="px-6 py-6 border-r border-white/20 text-center opacity-30">---</td>
                                    {products.map((product) => (
                                        <td key={product.id} className="px-4 py-6 text-center text-blue-400 text-lg">
                                            {reports.filter(r => r.productId === product.id).reduce((acc, curr) => acc + curr.quantity, 0)}
                                        </td>
                                    ))}
                                    <td className="px-8 py-6 text-right text-emerald-400 text-xl border-l border-white/10">
                                        {reports.reduce((acc, curr) => acc + curr.quantity, 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </main>

            {/* Detail Modal */}
            {selectedCell && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCell(null)}>
                    <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedCell.store.name} - {selectedCell.product.name}</h3>
                                <p className="text-sm text-slate-400 mt-1">不具合詳細レポート</p>
                            </div>
                            <button onClick={() => setSelectedCell(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {getCellReports(selectedCell.store.id, selectedCell.product.id).map((report, idx) => (
                                <div key={idx} className="bg-white/5 rounded-xl p-5 border border-white/10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-2xl font-bold text-blue-400">数量: {report.quantity}</span>
                                            {report.category && (
                                                <div className="mt-2 inline-block px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/30">
                                                    {report.category}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleString('ja-JP')}</span>
                                    </div>

                                    {report.comment && (
                                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                                            <p className="text-sm text-slate-300 leading-relaxed">{report.comment}</p>
                                        </div>
                                    )}

                                    {report.imageUrl && (
                                        <div className="mt-3">
                                            <img src={report.imageUrl} alt="不具合写真" className="w-full rounded-lg" />
                                        </div>
                                    )}

                                    {!report.comment && !report.imageUrl && (
                                        <p className="text-sm text-slate-600 italic">詳細情報なし</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

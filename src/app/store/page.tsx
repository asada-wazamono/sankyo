'use client';

import { useState, useEffect } from 'react';
import { Package, History, Clock, Camera, Save, Edit3, CheckCircle2, Loader2, Info } from 'lucide-react';
import { getProducts, getReportsByPeriod, submitReports } from '@/lib/actions';

interface ReportRow {
    productId: string;
    name: string;
    quantity: number;
    category: string;
    comment: string;
    file: File | null;
}

const DEFECT_CATEGORIES = [
    '配送時破損',
    '製造不良(寸法/糊)',
    '汚れ・水濡れ',
    '誤配送・数量不足',
    'その他'
];

export default function StoreDashboard() {
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('');
    const [period, setPeriod] = useState('2026-01-A');
    const [periodLabel, setPeriodLabel] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [rows, setRows] = useState<ReportRow[]>([]);

    useEffect(() => {
        const uid = localStorage.getItem('user_id') || '';
        const uname = localStorage.getItem('user_name') || '店舗';
        setUserId(uid);
        setUserName(uname);

        // Automatically determine period
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const pCode = `${year}-${String(month).padStart(2, '0')}-${day <= 15 ? 'A' : 'B'}`;
        const pLabel = `${year}年${month}月 ${day <= 15 ? '前半' : '後半'}`;
        setPeriod(pCode);
        setPeriodLabel(pLabel);

        if (uid) {
            initData(uid, pCode);
        }
    }, []);

    const initData = async (uid: string, pCode: string) => {
        setIsLoading(true);
        const [pList, rList] = await Promise.all([
            getProducts(),
            getReportsByPeriod(pCode)
        ]);

        // Filter reports for THIS user specifically
        const userReports = rList.filter((r: any) => r.userId === uid);

        const initialRows = pList.map((p: any) => {
            const existing = userReports.find((r: any) => r.productId === p.id);
            return {
                productId: p.id,
                name: p.name,
                quantity: existing ? existing.quantity : 0,
                category: existing?.category || '',
                comment: existing?.comment || '',
                file: null
            };
        });

        setRows(initialRows as ReportRow[]);

        // If no reports yet, start in editing mode
        if (userReports.length === 0) {
            setIsEditing(true);
        }

        setIsLoading(false);
    };

    const handleUpdateRow = (index: number, field: keyof ReportRow, value: any) => {
        const newRows = [...rows];
        newRows[index] = { ...newRows[index], [field]: value };
        setRows(newRows);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await submitReports(userId, period, rows);
            setIsEditing(false);
            alert('報告データを保存しました。');
        } catch (err) {
            alert('保存に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-12">
            {/* Navigation */}
            <nav className="glass-nav sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">S</div>
                    <span className="font-semibold text-lg tracking-tight text-white">報告システム</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">{userName}</span>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-sm text-red-400 hover:text-red-300 transition-colors">ログアウト</button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 mt-8">
                {/* Status Header */}
                <div className="glass-card p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 border-l-blue-500 shadow-xl">
                    <div>
                        <div className="text-sm text-blue-400 font-bold mb-1 uppercase tracking-wider">報告期間</div>
                        <h2 className="text-3xl font-bold text-white">{periodLabel}</h2>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${isLocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            <Clock size={18} />
                            <span className="font-bold">{isLocked ? '締め切り済み' : '報告受付中 (期間内修正可)'}</span>
                        </div>
                    </div>
                </div>

                {/* Simplified Table Form */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Package size={20} className="text-blue-500" />
                            報告内容の入力
                        </h3>
                        {!isEditing && !isLoading && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-bold transition-all border border-blue-500/20"
                            >
                                <Edit3 size={16} />
                                修正する
                            </button>
                        )}
                    </div>

                    <div className="glass-card overflow-hidden ring-1 ring-white/10 shadow-2xl min-h-[300px] flex flex-col">
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-blue-500" size={40} />
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
                                <Info size={40} className="mb-4 text-slate-600" />
                                <p className="font-bold">登録されている商品マスタがありません</p>
                                <p className="text-sm">本部の設定をお待ちください。</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                                        <th className="px-6 py-5">商品名</th>
                                        <th className="px-6 py-5 w-32">数量</th>
                                        <th className="px-6 py-5 w-48">不具合種類</th>
                                        <th className="px-6 py-5 w-40">添付</th>
                                        <th className="px-6 py-5">コメント</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {rows.map((row, idx) => (
                                        <tr key={row.productId} className={`transition-all ${row.quantity > 0 ? 'bg-blue-500/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white">{row.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={!isEditing || isLocked}
                                                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white transition-all outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-30 ${row.quantity > 0 ? 'border-blue-500/50 bg-blue-500/10 font-bold' : 'border-white/10'
                                                        }`}
                                                    value={row.quantity || ''}
                                                    placeholder="0"
                                                    onChange={(e) => handleUpdateRow(idx, 'quantity', parseInt(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    disabled={!isEditing || isLocked || row.quantity === 0}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-30"
                                                    value={row.category}
                                                    onChange={(e) => handleUpdateRow(idx, 'category', e.target.value)}
                                                >
                                                    <option value="">選択してください</option>
                                                    {DEFECT_CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed transition-all ${!isEditing || isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'
                                                    } ${row.file ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-white/20 text-slate-500'
                                                    }`}>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        disabled={!isEditing || isLocked}
                                                        accept="image/*"
                                                        onChange={(e) => handleUpdateRow(idx, 'file', e.target.files?.[0] || null)}
                                                    />
                                                    {row.file ? <CheckCircle2 size={16} /> : <Camera size={16} />}
                                                    <span className="text-xs font-bold">{row.file ? '登録済' : '写真添付'}</span>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    disabled={!isEditing || isLocked}
                                                    placeholder="内容・状況など"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-30"
                                                    value={row.comment}
                                                    onChange={(e) => handleUpdateRow(idx, 'comment', e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        {isEditing ? (
                            <button
                                onClick={handleSave}
                                disabled={isLocked || isSubmitting || rows.length === 0}
                                className="btn-primary px-12 py-4 text-lg shadow-xl shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={22} />}
                                報告内容を保存する
                            </button>
                        ) : (
                            <div className="flex items-center gap-4 bg-emerald-500/10 px-6 py-4 rounded-2xl border border-emerald-500/20">
                                <CheckCircle2 className="text-emerald-500" size={24} />
                                <div>
                                    <p className="text-white font-bold">報告データの送信が完了しています</p>
                                    <p className="text-xs text-slate-400 mt-0.5">※期間内であれば、右上のボタンからいつでも修正・更新が可能です。</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

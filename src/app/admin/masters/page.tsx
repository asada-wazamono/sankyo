'use client';

import { useState, useEffect } from 'react';
import {
    Package,
    Store as StoreIcon,
    ArrowLeft,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Loader2,
    Eye,
    EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { getProducts, getStores, upsertProduct, upsertStore, deleteProduct, deleteStore } from '@/lib/actions';

export default function MastersPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editBuffer, setEditBuffer] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showPwd, setShowPwd] = useState<string | null>(null);

    const [products, setProducts] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setIsLoading(true);
        const [pList, sList] = await Promise.all([getProducts(), getStores()]);
        setProducts(pList);
        setStores(sList);
        setIsLoading(false);
    };

    const getNextCode = (items: any[], type: 'products' | 'stores') => {
        if (items.length === 0) return type === 'stores' ? '2001' : '1001';
        const codes = items.map(item => parseInt(type === 'stores' ? item.storeCode : "0")).filter(c => !isNaN(c) && c > 0);
        if (codes.length === 0) return type === 'stores' ? '2001' : '1001';
        return (Math.max(...codes) + 1).toString();
    };

    const handleAdd = () => {
        const newId = `temp-${Date.now()}`;
        if (activeTab === 'products') {
            const newItem = { id: newId, name: '' };
            setIsEditing(newId);
            setEditBuffer(newItem);
        } else {
            const nextCode = getNextCode(stores, 'stores');
            const newItem = {
                id: newId,
                name: '',
                storeCode: nextCode,
                loginId: `store_${nextCode}`,
                password: '' // Will be generated if empty
            };
            setIsEditing(newId);
            setEditBuffer(newItem);
        }
    };

    const handleSave = async (id: string) => {
        if (!editBuffer.name) {
            alert('名称を入力してください');
            return;
        }

        try {
            if (activeTab === 'products') {
                await upsertProduct(id.startsWith('temp') ? null : id, editBuffer);
            } else {
                await upsertStore(id.startsWith('temp') ? null : id, editBuffer);
            }
            setIsEditing(null);
            await refreshData();
        } catch (err) {
            alert('保存に失敗しました');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('本当に削除しますか？\n※関連する報告データもすべて削除されます。')) {
            if (activeTab === 'products') {
                await deleteProduct(id);
            } else {
                await deleteStore(id);
            }
            await refreshData();
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-12 text-slate-200">
            <nav className="glass-nav sticky top-0 z-50 px-8 py-4 flex items-center gap-6">
                <Link href="/admin" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="font-bold text-white text-xl">マスタ構成</h1>
            </nav>

            <main className="max-w-6xl mx-auto px-6 mt-10">
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => { setActiveTab('products'); setIsEditing(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                            }`}
                    >
                        <Package size={18} />
                        商品リスト
                    </button>
                    <button
                        onClick={() => { setActiveTab('stores'); setIsEditing(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'stores' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                            }`}
                    >
                        <StoreIcon size={18} />
                        店舗管理
                    </button>
                </div>

                <div className="glass-card border-white/5 ring-1 ring-white/10 shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <h2 className="text-lg font-bold text-white">
                            {activeTab === 'products' ? '商品マスタ' : '店舗マスタ'}
                        </h2>
                        <button
                            onClick={handleAdd}
                            disabled={isEditing !== null}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Plus size={16} />
                            新規登録
                        </button>
                    </div>

                    <div className="min-h-[400px] flex flex-col">
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-blue-500" size={40} />
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                                        <th className="px-6 py-4">{activeTab === 'products' ? '商品ID' : '店舗コード'}</th>
                                        <th className="px-6 py-4">名称</th>
                                        {activeTab === 'stores' && <th className="px-6 py-4">ログインID / パスワード</th>}
                                        <th className="px-6 py-4 text-right pr-10">アクション</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-medium">
                                    {/* Temp Row */}
                                    {isEditing && isEditing.startsWith('temp') && (
                                        <tr className="bg-blue-500/10">
                                            <td className="px-6 py-4">
                                                {activeTab === 'stores' ? (
                                                    <input
                                                        className="bg-slate-800 border-2 border-blue-500 rounded-lg px-2 py-1 text-white w-24 outline-none"
                                                        value={editBuffer.storeCode}
                                                        onChange={(e) => setEditBuffer({ ...editBuffer, storeCode: e.target.value })}
                                                    />
                                                ) : <span className="text-blue-400 font-bold">NEW</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    className="bg-slate-800 border-2 border-blue-500 rounded-lg px-3 py-1.5 text-white w-full outline-none"
                                                    value={editBuffer.name}
                                                    onChange={(e) => setEditBuffer({ ...editBuffer, name: e.target.value })}
                                                    placeholder="名称を入力してください"
                                                    autoFocus
                                                />
                                            </td>
                                            {activeTab === 'stores' && (
                                                <td className="px-6 py-4 space-y-2">
                                                    <input
                                                        className="bg-slate-800 border border-white/20 rounded-lg px-2 py-1 text-white w-full text-sm outline-none"
                                                        value={editBuffer.loginId}
                                                        onChange={(e) => setEditBuffer({ ...editBuffer, loginId: e.target.value })}
                                                        placeholder="ログインID"
                                                    />
                                                    <input
                                                        className="bg-slate-800 border border-white/20 rounded-lg px-2 py-1 text-white w-full text-sm outline-none"
                                                        value={editBuffer.password}
                                                        onChange={(e) => setEditBuffer({ ...editBuffer, password: e.target.value })}
                                                        placeholder="パスワード（空欄で自動生成）"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right pr-10">
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => handleSave(isEditing)} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"><Save size={20} /></button>
                                                    <button onClick={() => setIsEditing(null)} className="p-2.5 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10"><X size={20} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {(activeTab === 'products' ? products : stores).map(item => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                {isEditing === item.id ? (
                                                    activeTab === 'stores' ? (
                                                        <input
                                                            className="bg-slate-800 border-2 border-blue-500 rounded-lg px-2 py-1 text-white w-24"
                                                            value={editBuffer.storeCode}
                                                            onChange={(e) => setEditBuffer({ ...editBuffer, storeCode: e.target.value })}
                                                        />
                                                    ) : item.id.substring(0, 8)
                                                ) : (activeTab === 'stores' ? item.storeCode : item.id.substring(0, 8))}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-white">
                                                {isEditing === item.id ? (
                                                    <input
                                                        className="bg-slate-800 border-2 border-blue-500 rounded-lg px-3 py-1.5 text-white w-full outline-none"
                                                        value={editBuffer.name}
                                                        onChange={(e) => setEditBuffer({ ...editBuffer, name: e.target.value })}
                                                    />
                                                ) : item.name}
                                            </td>
                                            {activeTab === 'stores' && (
                                                <td className="px-6 py-4">
                                                    {isEditing === item.id ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                className="bg-slate-800 border border-white/20 rounded-lg px-2 py-1 text-white w-full text-sm outline-none"
                                                                value={editBuffer.loginId}
                                                                onChange={(e) => setEditBuffer({ ...editBuffer, loginId: e.target.value })}
                                                            />
                                                            <input
                                                                className="bg-slate-800 border border-white/20 rounded-lg px-2 py-1 text-white w-full text-sm outline-none"
                                                                value={editBuffer.password}
                                                                onChange={(e) => setEditBuffer({ ...editBuffer, password: e.target.value })}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs text-slate-400 font-mono">ID: {item.loginId}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-blue-400 font-mono">PW: {showPwd === item.id ? item.password : '••••••••'}</span>
                                                                <button
                                                                    onClick={() => setShowPwd(showPwd === item.id ? null : item.id)}
                                                                    className="p-1 hover:bg-white/5 rounded text-slate-500"
                                                                >
                                                                    {showPwd === item.id ? <EyeOff size={12} /> : <Eye size={12} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right pr-10">
                                                <div className="flex justify-end gap-2">
                                                    {isEditing === item.id ? (
                                                        <>
                                                            <button onClick={() => handleSave(item.id)} className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"><Save size={20} /></button>
                                                            <button onClick={() => setIsEditing(null)} className="p-2.5 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10"><X size={20} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => { setIsEditing(item.id); setEditBuffer(item); }} className="p-2 text-slate-500 hover:text-blue-400 transition-colors"><Edit2 size={18} /></button>
                                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {!isLoading && (activeTab === 'products' ? products : stores).length === 0 && !isEditing && (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-600">
                                <p className="italic">登録データがありません。</p>
                                <p className="text-[10px] mt-2 uppercase tracking-widest font-bold">New records will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

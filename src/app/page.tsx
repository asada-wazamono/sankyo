'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/actions';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login(loginId, password);

      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_role', user.role);
      localStorage.setItem('user_name', user.name);

      if (user.role === 'HQ') {
        router.push('/admin');
      } else {
        router.push('/store');
      }
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md glass-card p-10 z-10 animate-fade-in shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">返品報告システム</h1>
          <p className="text-slate-400">アカウント情報を入力してログイン</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ログインID</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="input-glass"
              placeholder="admin または 店舗ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isLoading ? '認証中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            &copy; 2026 返品管理ポータル
          </p>
        </div>
      </div>
    </div>
  );
}

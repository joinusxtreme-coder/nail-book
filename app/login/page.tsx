'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage('確認メールを送信しました。メールをご確認ください。');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('メールアドレスまたはパスワードが違います');
      else window.location.href = next;
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto py-16 space-y-6">
      <div className="text-center">
        <p className="text-2xl">💅</p>
        <h1 className="text-xl font-bold text-gray-800 mt-2">nail book</h1>
        <p className="text-sm text-gray-500 mt-1">{isSignup ? 'アカウント作成' : 'ログイン'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">メールアドレス</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">パスワード</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400"
          />
        </div>
        {message && (
          <p className={`text-xs ${message.includes('送信') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
        )}
        <button
          type="submit" disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? '処理中...' : isSignup ? 'アカウント作成' : 'ログイン'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {isSignup ? 'すでにアカウントをお持ちの方は' : 'アカウントをお持ちでない方は'}
        <button onClick={() => setIsSignup(!isSignup)} className="text-pink-500 font-bold ml-1">
          {isSignup ? 'ログイン' : '新規登録'}
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

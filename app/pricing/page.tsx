'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login?next=/pricing';
      return;
    }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">料金プラン</h1>
        <p className="text-gray-500 mt-2 text-sm">nail book でビジネスを加速しましょう</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Free */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-400">無料プラン</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">¥0</p>
            <p className="text-xs text-gray-400">ずっと無料</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">✓ 顧客登録 10人まで</li>
            <li className="flex items-center gap-2">✓ 予約管理</li>
            <li className="flex items-center gap-2">✓ メニュー管理</li>
            <li className="flex items-center gap-2 text-gray-300">✗ 売上レポート</li>
            <li className="flex items-center gap-2 text-gray-300">✗ 顧客無制限</li>
            <li className="flex items-center gap-2 text-gray-300">✗ CSVエクスポート</li>
          </ul>
          <div className="bg-gray-50 text-center py-2 rounded-lg text-sm text-gray-500 font-medium">現在のプラン</div>
        </div>

        {/* Pro */}
        <div className="bg-pink-50 rounded-2xl border-2 border-pink-400 p-6 space-y-4 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">おすすめ</div>
          <div>
            <p className="text-sm font-bold text-pink-500">Proプラン</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">¥980<span className="text-base font-normal text-gray-500">/月</span></p>
            <p className="text-xs text-gray-400">いつでも解約可能</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">✓ 顧客登録 <strong>無制限</strong></li>
            <li className="flex items-center gap-2">✓ 予約管理</li>
            <li className="flex items-center gap-2">✓ メニュー管理</li>
            <li className="flex items-center gap-2">✓ <strong>売上レポート</strong></li>
            <li className="flex items-center gap-2">✓ <strong>CSVエクスポート</strong></li>
            <li className="flex items-center gap-2">✓ <strong>優先サポート</strong></li>
          </ul>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? '処理中...' : '今すぐ始める →'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        クレジットカードで安全に決済（Stripe）。いつでも解約できます。
      </p>
    </div>
  );
}

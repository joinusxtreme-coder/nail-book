'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/lib/useSubscription';

interface Sale {
  id: string;
  scheduled_at: string;
  price: number | null;
  customers: { name: string } | null;
  nail_menus: { name: string; price: number } | null;
}

export default function SalesPage() {
  const { isPro, loading: subLoading } = useSubscription();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => { fetchSales(); }, [selectedMonth]);

  async function fetchSales() {
    setLoading(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 1).toISOString();
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, price, customers(name), nail_menus(name, price)')
      .eq('status', 'completed')
      .gte('scheduled_at', start)
      .lt('scheduled_at', end)
      .order('scheduled_at', { ascending: false });
    setSales((data || []) as unknown as Sale[]);
    setLoading(false);
  }

  const totalRevenue = sales.reduce((s, r) => s + (r.price ?? r.nail_menus?.price ?? 0), 0);
  const avgRevenue = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;

  // メニュー別集計
  const menuStats: Record<string, { count: number; revenue: number }> = {};
  sales.forEach(s => {
    const name = s.nail_menus?.name || 'その他';
    if (!menuStats[name]) menuStats[name] = { count: 0, revenue: 0 };
    menuStats[name].count++;
    menuStats[name].revenue += s.price ?? s.nail_menus?.price ?? 0;
  });
  const menuRanking = Object.entries(menuStats).sort((a, b) => b[1].revenue - a[1].revenue);

  if (!subLoading && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <p className="text-4xl">🔒</p>
        <h2 className="text-lg font-bold text-gray-800">売上レポートはProプランの機能です</h2>
        <p className="text-sm text-gray-500">月額¥980でデータ分析・売上管理が使い放題</p>
        <Link href="/pricing" className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
          Proプランを見る →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">売上レポート</h1>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-pink-400" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '売上合計', value: `¥${totalRevenue.toLocaleString()}`, color: 'text-green-600' },
          { label: '完了件数', value: `${sales.length}件`, color: 'text-pink-500' },
          { label: '客単価', value: `¥${avgRevenue.toLocaleString()}`, color: 'text-purple-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {menuRanking.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-50 font-bold text-sm text-gray-700">メニュー別売上</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left px-5 py-2 font-medium">メニュー</th>
                <th className="text-right px-4 py-2 font-medium">件数</th>
                <th className="text-right px-4 py-2 font-medium">売上</th>
              </tr>
            </thead>
            <tbody>
              {menuRanking.map(([name, stat]) => (
                <tr key={name} className="border-t border-gray-50 hover:bg-pink-50">
                  <td className="px-5 py-2 text-gray-800">{name}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{stat.count}件</td>
                  <td className="px-4 py-2 text-right font-bold text-gray-700">¥{stat.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-50 font-bold text-sm text-gray-700">完了した予約</div>
        {loading ? <p className="p-8 text-center text-gray-400 text-sm">読み込み中...</p> :
          sales.length === 0 ? <p className="p-8 text-center text-gray-400 text-sm">この月の売上データがありません</p> :
          <ul className="divide-y divide-gray-50">
            {sales.map(s => {
              const dt = new Date(s.scheduled_at);
              const price = s.price ?? s.nail_menus?.price ?? 0;
              return (
                <li key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-pink-50">
                  <div>
                    <p className="font-medium text-gray-800">{s.customers?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{s.nail_menus?.name || '—'} · {dt.toLocaleDateString('ja-JP')}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">¥{price.toLocaleString()}</p>
                </li>
              );
            })}
          </ul>
        }
      </div>
    </div>
  );
}

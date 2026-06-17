'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({ customers: 0, today: 0, monthRevenue: 0, upcoming: 0 });
  const [upcomingList, setUpcomingList] = useState<{ id: string; scheduled_at: string; customers: { name: string } | null; nail_menus: { name: string; price: number } | null; price: number | null }[]>([]);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const [{ count: custCount }, { count: todayCount }, { data: monthData }, { data: upcomingData }] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('scheduled_at', startOfToday).lt('scheduled_at', endOfToday).neq('status', 'cancelled'),
      supabase.from('appointments').select('price').gte('scheduled_at', startOfMonth).eq('status', 'completed'),
      supabase.from('appointments').select('id, scheduled_at, price, customers(name), nail_menus(name, price)').gte('scheduled_at', new Date().toISOString()).eq('status', 'confirmed').order('scheduled_at').limit(5),
    ]);

    const revenue = (monthData || []).reduce((s, r) => s + (r.price || 0), 0);
    setStats({ customers: custCount || 0, today: todayCount || 0, monthRevenue: revenue, upcoming: (upcomingData || []).length });
    setUpcomingList((upcomingData || []) as unknown as typeof upcomingList);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <Link href="/appointments/new" className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600">＋ 予約追加</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '総顧客数', value: `${stats.customers}人`, color: 'text-pink-500' },
          { label: '今日の予約', value: `${stats.today}件`, color: 'text-purple-500' },
          { label: '今月売上', value: `¥${stats.monthRevenue.toLocaleString()}`, color: 'text-green-600' },
          { label: '直近予約', value: `${stats.upcoming}件`, color: 'text-blue-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-700">直近の予約</h2>
          <Link href="/appointments" className="text-xs text-pink-500 hover:underline">すべて見る →</Link>
        </div>
        {upcomingList.length === 0 ? (
          <p className="p-6 text-center text-gray-400 text-sm">予約がありません</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {upcomingList.map(a => {
              const dt = new Date(a.scheduled_at);
              const price = a.price ?? a.nail_menus?.price ?? 0;
              return (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-pink-50">
                  <div>
                    <p className="font-medium text-gray-800">{a.customers?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{a.nail_menus?.name || '—'} · {dt.toLocaleDateString('ja-JP')} {dt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-700">¥{(price).toLocaleString()}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/appointments', label: '📅 予約一覧' },
          { href: '/appointments/new', label: '＋ 予約追加' },
          { href: '/customers', label: '👤 顧客管理' },
          { href: '/sales', label: '💰 売上レポート' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium text-gray-700 hover:border-pink-200 hover:text-pink-500 text-center shadow-sm">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

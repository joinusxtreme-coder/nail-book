'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Upcoming = { id: string; scheduled_at: string; customers: { name: string } | null; nail_menus: { name: string; price: number } | null; price: number | null };

export default function RootPage() {
  const [user, setUser] = useState<{ id: string } | null | undefined>(undefined);
  const [stats, setStats] = useState({ customers: 0, today: 0, monthRevenue: 0, upcoming: 0 });
  const [upcomingList, setUpcomingList] = useState<Upcoming[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) fetchStats();
    });
  }, []);

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
    setUpcomingList((upcomingData || []) as unknown as Upcoming[]);
    setStatsLoading(false);
  }

  // 初期チェック中
  if (user === undefined) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
    </div>
  );

  // 未ログイン → ランディングページ
  if (user === null) return <LandingPage />;

  // ログイン済み → ダッシュボード
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <Link href="/appointments/new" className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600">＋ 予約追加</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
              <div className="h-7 bg-gray-200 rounded w-20" />
            </div>
          ))
        ) : (
          [
            { label: '総顧客数', value: `${stats.customers}人`, color: 'text-pink-500' },
            { label: '今日の予約', value: `${stats.today}件`, color: 'text-purple-500' },
            { label: '今月売上', value: `¥${stats.monthRevenue.toLocaleString()}`, color: 'text-green-600' },
            { label: '直近予約', value: `${stats.upcoming}件`, color: 'text-blue-500' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-700">直近の予約</h2>
          <Link href="/appointments" className="text-xs text-pink-500 hover:underline">すべて見る →</Link>
        </div>
        {statsLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded flex-1" />
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : upcomingList.length === 0 ? (
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
                  <p className="text-sm font-bold text-gray-700">¥{price.toLocaleString()}</p>
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

function LandingPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="text-center space-y-6 py-12">
        <div className="inline-block bg-pink-50 text-pink-600 text-xs font-bold px-3 py-1 rounded-full">ネイリスト専用・無料から始められる</div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          管理業務ゼロにして<br />施術に集中しよう
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          予約・顧客・売上を1つのアプリで。LINEやスプレッドシートのバラバラ管理から卒業。
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-8 py-3 rounded-xl text-base transition-colors">
            無料で始める →
          </Link>
          <Link href="/pricing" className="border border-pink-200 text-pink-500 font-bold px-6 py-3 rounded-xl text-base hover:bg-pink-50 transition-colors">
            料金を見る
          </Link>
        </div>
        <p className="text-xs text-gray-400">クレジットカード不要・顧客10人まで永久無料</p>
      </section>

      {/* 機能 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-center text-gray-800">必要な機能がぜんぶ入ってる</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📅', title: '予約管理', desc: '日時・顧客・メニューを一括登録' },
            { icon: '👤', title: '顧客カルテ', desc: '過去の施術・好みを記録' },
            { icon: '💰', title: '売上レポート', desc: 'メニュー別・月別の売上を自動集計' },
            { icon: '💅', title: 'メニュー管理', desc: '価格・所要時間を登録してすぐ呼び出し' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-2">
              <p className="text-2xl">{f.icon}</p>
              <p className="font-bold text-gray-800 text-sm">{f.title}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before/After */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold text-center text-gray-800">こんなお悩みありませんか？</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-bold text-red-500">❌ 今まで</p>
            {['LINEで予約受付 → Googleカレンダーに手入力', '売上はスプレッドシートに毎回記入', '顧客の好みはメモ帳・記憶頼り', '月末の集計が毎回1〜2時間かかる'].map(t => (
              <p key={t} className="text-sm text-gray-600 flex items-start gap-2"><span>•</span>{t}</p>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-green-600">✅ nail bookなら</p>
            {['予約登録したら顧客・売上に自動反映', '売上レポートがリアルタイムで見える', '顧客カルテにメモ・履歴を一元管理', 'ダッシュボードを開けば今日の状況が一目でわかる'].map(t => (
              <p key={t} className="text-sm text-gray-700 flex items-start gap-2"><span>•</span>{t}</p>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800">今すぐ無料で始めよう</h2>
        <p className="text-gray-500 text-sm">登録30秒・カード不要・いつでも解約OK</p>
        <Link href="/login" className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors">
          無料アカウントを作る →
        </Link>
      </section>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  price: number | null;
  memo: string | null;
  customers: { name: string } | null;
  nail_menus: { name: string; price: number } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: '確定', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-500' },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  async function fetch() {
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, status, price, memo, customers(name), nail_menus(name, price)')
      .order('scheduled_at', { ascending: false })
      .limit(50);
    setAppointments((data || []) as unknown as Appointment[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    fetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">予約一覧</h1>
        <Link href="/appointments/new" className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600">＋ 予約追加</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-gray-400 text-sm">読み込み中...</p>
        ) : appointments.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">予約がありません</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {appointments.map(a => {
              const dt = new Date(a.scheduled_at);
              const price = a.price ?? a.nail_menus?.price ?? 0;
              const s = STATUS_LABELS[a.status] || STATUS_LABELS.confirmed;
              return (
                <li key={a.id} className="px-5 py-4 flex items-center gap-4 hover:bg-pink-50">
                  <div className="text-center min-w-[48px]">
                    <p className="text-xs text-gray-400">{dt.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</p>
                    <p className="text-sm font-bold text-gray-700">{dt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{a.customers?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{a.nail_menus?.name || '—'}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-700">¥{price.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                  {a.status === 'confirmed' && (
                    <button onClick={() => updateStatus(a.id, 'completed')}
                      className="text-xs text-green-600 hover:underline ml-1">完了</button>
                  )}
                  {a.status !== 'cancelled' && (
                    <button onClick={() => updateStatus(a.id, 'cancelled')}
                      className="text-xs text-red-400 hover:underline">取消</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

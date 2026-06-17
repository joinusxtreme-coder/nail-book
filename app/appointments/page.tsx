'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  price: number | null;
  memo: string | null;
  customer_id: string | null;
  menu_id: string | null;
  customers: { name: string } | null;
  nail_menus: { name: string; price: number } | null;
}

interface Customer { id: string; name: string; }
interface Menu { id: string; name: string; price: number; }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: '確定', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-500' },
};

function AppointmentsInner() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Appointment | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [form, setForm] = useState({ scheduled_at: '', customer_id: '', menu_id: '', price: '', status: 'confirmed', memo: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: appts }, { data: custs }, { data: mnus }] = await Promise.all([
      supabase.from('appointments').select('id, scheduled_at, status, price, memo, customer_id, menu_id, customers(name), nail_menus(name, price)').order('scheduled_at', { ascending: false }).limit(50),
      supabase.from('customers').select('id, name').order('name'),
      supabase.from('nail_menus').select('id, name, price').order('name'),
    ]);
    setAppointments((appts || []) as unknown as Appointment[]);
    setCustomers(custs || []);
    setMenus(mnus || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    loadAll();
  }

  async function handleDelete(id: string) {
    if (!confirm('この予約を削除しますか？')) return;
    await supabase.from('appointments').delete().eq('id', id);
    loadAll();
  }

  function openEdit(a: Appointment) {
    const dt = new Date(a.scheduled_at);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({
      scheduled_at: local,
      customer_id: a.customer_id || '',
      menu_id: a.menu_id || '',
      price: a.price?.toString() || '',
      status: a.status,
      memo: a.memo || '',
    });
    setEditItem(a);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    await supabase.from('appointments').update({
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      customer_id: form.customer_id || null,
      menu_id: form.menu_id || null,
      price: form.price ? Number(form.price) : null,
      status: form.status,
      memo: form.memo || null,
    }).eq('id', editItem.id);
    setSaving(false);
    setEditItem(null);
    loadAll();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">予約一覧</h1>
        <Link href="/appointments/new" className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600">＋ 予約追加</Link>
      </div>

      {editItem && (
        <div className="bg-white border border-pink-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-sm text-gray-700 mb-3">予約を編集</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">日時</label>
                <input type="datetime-local" required value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ステータス</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
                  <option value="confirmed">確定</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">顧客</label>
                <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
                  <option value="">未選択</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">メニュー</label>
                <select value={form.menu_id} onChange={e => {
                  const m = menus.find(m => m.id === e.target.value);
                  setForm(f => ({ ...f, menu_id: e.target.value, price: m ? m.price.toString() : f.price }));
                }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
                  <option value="">未選択</option>
                  {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">料金（円）</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="例：5000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">メモ</label>
              <textarea rows={2} value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditItem(null)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">キャンセル</button>
              <button type="submit" disabled={saving} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center">
                <div className="h-10 bg-gray-100 rounded w-12" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
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
                  <div className="flex gap-2 shrink-0">
                    {a.status === 'confirmed' && (
                      <button onClick={() => updateStatus(a.id, 'completed')} className="text-xs text-green-600 hover:underline">完了</button>
                    )}
                    {a.status !== 'cancelled' && (
                      <button onClick={() => updateStatus(a.id, 'cancelled')} className="text-xs text-red-400 hover:underline">取消</button>
                    )}
                    <button onClick={() => openEdit(a)} className="text-xs text-blue-500 hover:underline">編集</button>
                    <button onClick={() => handleDelete(a.id)} className="text-xs text-gray-400 hover:underline">削除</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  return <AuthGuard><AppointmentsInner /></AuthGuard>;
}

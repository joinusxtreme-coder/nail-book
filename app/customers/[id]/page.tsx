'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface Customer { id: string; name: string; phone: string | null; email: string | null; memo: string | null; created_at: string; }
interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  price: number | null;
  nail_menus: { name: string; price: number } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: '確定', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-500' },
};

function CustomerDetailInner() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', memo: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    const [{ data: cust }, { data: appts }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('appointments').select('id, scheduled_at, status, price, nail_menus(name, price)').eq('customer_id', id).order('scheduled_at', { ascending: false }),
    ]);
    if (cust) {
      setCustomer(cust);
      setForm({ name: cust.name, phone: cust.phone || '', email: cust.email || '', memo: cust.memo || '' });
    }
    setAppointments((appts || []) as unknown as Appointment[]);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('customers').update({
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      memo: form.memo || null,
    }).eq('id', id);
    setSaving(false);
    setEditing(false);
    loadData();
  }

  async function handleDelete() {
    if (!confirm(`「${customer?.name}」を削除しますか？過去の予約との紐付けも解除されます。`)) return;
    await supabase.from('customers').delete().eq('id', id);
    router.push('/customers');
  }

  const totalRevenue = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + (a.price ?? a.nail_menus?.price ?? 0), 0);
  const visitCount = appointments.filter(a => a.status === 'completed').length;

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-40" />
      <div className="bg-white rounded-xl p-6 space-y-3">
        <div className="h-5 bg-gray-100 rounded w-32" />
        <div className="h-4 bg-gray-100 rounded w-48" />
        <div className="h-4 bg-gray-100 rounded w-36" />
      </div>
    </div>
  );

  if (!customer) return (
    <div className="text-center py-20 text-gray-400">
      <p>顧客が見つかりません</p>
      <Link href="/customers" className="text-pink-500 hover:underline text-sm mt-2 inline-block">← 顧客一覧へ</Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="text-sm text-gray-400 hover:text-gray-600">← 顧客一覧</Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-xl font-bold text-gray-800">{customer.name}</h1>
      </div>

      {/* 顧客情報 */}
      {editing ? (
        <div className="bg-white rounded-xl border border-pink-100 p-5 shadow-sm">
          <h2 className="font-bold text-sm text-gray-700 mb-3">顧客情報を編集</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">お名前 *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">メール</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">メモ</label>
              <textarea rows={3} value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="アレルギー・好みなど"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">キャンセル</button>
              <button type="submit" disabled={saving} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-lg font-bold text-gray-800">{customer.name}</p>
              {customer.phone && <p className="text-sm text-gray-500">📞 {customer.phone}</p>}
              {customer.email && <p className="text-sm text-gray-500">✉️ {customer.email}</p>}
              {customer.memo && (
                <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 font-medium mb-1">メモ</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.memo}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">登録日: {new Date(customer.created_at).toLocaleDateString('ja-JP')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="text-xs text-blue-500 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">編集</button>
              <button onClick={handleDelete} className="text-xs text-red-400 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50">削除</button>
            </div>
          </div>
        </div>
      )}

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '来店回数', value: `${visitCount}回`, color: 'text-pink-500' },
          { label: '総売上', value: `¥${totalRevenue.toLocaleString()}`, color: 'text-green-600' },
          { label: '予約総数', value: `${appointments.length}件`, color: 'text-blue-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-xs text-gray-400">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* 施術履歴 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-700">施術履歴</h2>
          <Link href={`/appointments/new?customer_id=${id}`} className="text-xs text-pink-500 hover:underline">＋ 予約追加</Link>
        </div>
        {appointments.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">施術履歴がありません</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {appointments.map(a => {
              const dt = new Date(a.scheduled_at);
              const price = a.price ?? a.nail_menus?.price ?? 0;
              const s = STATUS_LABELS[a.status] || STATUS_LABELS.confirmed;
              return (
                <li key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-pink-50">
                  <div className="text-center min-w-[56px]">
                    <p className="text-xs text-gray-400">{dt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric' })}</p>
                    <p className="text-sm font-medium text-gray-700">{dt.toLocaleDateString('ja-JP', { day: 'numeric' })}日</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{a.nail_menus?.name || '—'}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-700">¥{price.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  return <AuthGuard><CustomerDetailInner /></AuthGuard>;
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface Customer { id: string; name: string; }
interface NailMenu { id: string; name: string; price: number; duration_min: number; }

function NewAppointmentInner() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menus, setMenus] = useState<NailMenu[]>([]);
  const [form, setForm] = useState({
    customer_id: '',
    menu_id: '',
    scheduled_date: '',
    scheduled_time: '10:00',
    price: '',
    memo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('customers').select('id, name').order('name').then(({ data }) => setCustomers(data || []));
    supabase.from('nail_menus').select('id, name, price, duration_min').order('name').then(({ data }) => setMenus(data || []));
    const today = new Date().toISOString().split('T')[0];
    setForm(f => ({ ...f, scheduled_date: today }));
  }, []);

  function onMenuChange(menuId: string) {
    const menu = menus.find(m => m.id === menuId);
    setForm(f => ({ ...f, menu_id: menuId, price: menu ? String(menu.price) : f.price }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const scheduled_at = new Date(`${form.scheduled_date}T${form.scheduled_time}:00+09:00`).toISOString();
    await supabase.from('appointments').insert({
      customer_id: form.customer_id || null,
      menu_id: form.menu_id || null,
      scheduled_at,
      price: form.price ? parseFloat(form.price) : null,
      memo: form.memo || null,
      status: 'confirmed',
    });
    router.push('/appointments');
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/appointments" className="text-gray-400 hover:text-gray-600 text-sm">← 予約一覧</Link>
      </div>
      <h1 className="text-xl font-bold text-gray-800">予約を追加</h1>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">顧客 <span className="text-red-400">*</span></label>
            <select required value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
              <option value="">顧客を選択</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Link href="/customers" className="text-xs text-pink-500 hover:underline mt-1 inline-block">＋ 新規顧客を登録</Link>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">施術メニュー</label>
            <select value={form.menu_id} onChange={e => onMenuChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
              <option value="">メニューを選択</option>
              {menus.map(m => <option key={m.id} value={m.id}>{m.name} (¥{m.price.toLocaleString()})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">日付 <span className="text-red-400">*</span></label>
              <input required type="date" value={form.scheduled_date}
                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">時間 <span className="text-red-400">*</span></label>
              <input required type="time" value={form.scheduled_time}
                onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">料金（円）</label>
            <input type="number" min="0" step="100" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="例：8000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">メモ</label>
            <textarea rows={2} value={form.memo}
              onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
              placeholder="デザインのご要望など"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Link href="/appointments" className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">キャンセル</Link>
            <button type="submit" disabled={saving}
              className="bg-pink-500 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-50">
              {saving ? '保存中...' : '予約を保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewAppointmentPage() {
  return <AuthGuard><NewAppointmentInner /></AuthGuard>;
}

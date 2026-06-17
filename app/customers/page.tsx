'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface Customer { id: string; name: string; phone: string | null; email: string | null; memo: string | null; created_at: string; }

function CustomersInner() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', memo: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('name');
    setCustomers(data || []);
    setLoading(false);
  }

  function openNew() { setForm({ name: '', phone: '', email: '', memo: '' }); setEditId(null); setShowForm(true); }
  function openEdit(c: Customer) { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', memo: c.memo || '' }); setEditId(c.id); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = { name: form.name, phone: form.phone || null, email: form.email || null, memo: form.memo || null };
    if (editId) await supabase.from('customers').update(data).eq('id', editId);
    else await supabase.from('customers').insert(data);
    setShowForm(false);
    setSaving(false);
    fetchCustomers();
  }

  async function handleDelete(id: string) {
    if (!confirm('この顧客を削除しますか？')) return;
    await supabase.from('customers').delete().eq('id', id);
    fetchCustomers();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">顧客管理</h1>
        <button onClick={openNew} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600">＋ 顧客追加</button>
      </div>

      {showForm && (
        <div className="bg-white border border-pink-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-sm text-gray-700 mb-3">{editId ? '顧客を編集' : '顧客を追加'}</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">お名前 <span className="text-red-400">*</span></label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例：山田 花子"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">電話番号</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="090-0000-0000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">メール</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="example@mail.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">メモ</label>
              <textarea rows={2} value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="アレルギー・好みなど"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">キャンセル</button>
              <button type="submit" disabled={saving} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-50 text-sm font-bold text-gray-600">登録顧客（{customers.length}人）</div>
        {loading ? <p className="p-8 text-center text-gray-400 text-sm">読み込み中...</p> :
          customers.length === 0 ? <p className="p-8 text-center text-gray-400 text-sm">顧客がまだ登録されていません</p> :
          <ul className="divide-y divide-gray-50">
            {customers.map(c => (
              <li key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-pink-50">
                <div>
                  <p className="font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">{[c.phone, c.email].filter(Boolean).join(' · ') || '連絡先未登録'}</p>
                </div>
                <div className="flex gap-3">
                  <Link href={`/customers/${c.id}`} className="text-xs text-pink-500 hover:underline">詳細</Link>
                  <button onClick={() => openEdit(c)} className="text-xs text-blue-500 hover:underline">編集</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:underline">削除</button>
                </div>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return <AuthGuard><CustomersInner /></AuthGuard>;
}

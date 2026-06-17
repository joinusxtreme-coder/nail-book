'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface NailMenu { id: string; name: string; category: string; price: number; duration_min: number; }

const CATEGORIES = ['ジェルネイル', 'スカルプ', 'ケア・オフ', 'アート', 'オプション', 'その他'];

function MenusInner() {
  const [menus, setMenus] = useState<NailMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: 'ジェルネイル', price: '', duration_min: '60' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMenus(); }, []);

  async function fetchMenus() {
    const { data } = await supabase.from('nail_menus').select('*').order('category').order('price');
    setMenus(data || []);
    setLoading(false);
  }

  function openNew() { setForm({ name: '', category: 'ジェルネイル', price: '', duration_min: '60' }); setEditId(null); setShowForm(true); }
  function openEdit(m: NailMenu) { setForm({ name: m.name, category: m.category, price: String(m.price), duration_min: String(m.duration_min) }); setEditId(m.id); setShowForm(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const data = { name: form.name, category: form.category, price: parseFloat(form.price), duration_min: parseInt(form.duration_min) };
    if (editId) await supabase.from('nail_menus').update(data).eq('id', editId);
    else await supabase.from('nail_menus').insert(data);
    setShowForm(false);
    setSaving(false);
    fetchMenus();
  }

  async function handleDelete(id: string) {
    if (!confirm('このメニューを削除しますか？')) return;
    await supabase.from('nail_menus').delete().eq('id', id);
    fetchMenus();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">メニュー管理</h1>
        <button onClick={openNew} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600">＋ メニュー追加</button>
      </div>

      {showForm && (
        <div className="bg-white border border-pink-100 rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-sm text-gray-700 mb-3">{editId ? 'メニューを編集' : 'メニューを追加'}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">メニュー名 <span className="text-red-400">*</span></label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例：ワンカラー（ハンド）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">所要時間（分）</label>
              <input type="number" min="10" step="10" value={form.duration_min}
                onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">料金（円） <span className="text-red-400">*</span></label>
              <input required type="number" min="0" step="100" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="例：8000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">キャンセル</button>
              <button type="submit" disabled={saving} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {loading ? <p className="p-8 text-center text-gray-400 text-sm">読み込み中...</p> :
          menus.length === 0 ? <p className="p-8 text-center text-gray-400 text-sm">メニューがまだ登録されていません</p> :
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="text-left px-5 py-2 font-medium">メニュー名</th>
                <th className="text-left px-4 py-2 font-medium">カテゴリ</th>
                <th className="text-right px-4 py-2 font-medium">時間</th>
                <th className="text-right px-4 py-2 font-medium">料金</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {menus.map(m => (
                <tr key={m.id} className="border-t border-gray-50 hover:bg-pink-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.category}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{m.duration_min}分</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-700">¥{m.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <button onClick={() => openEdit(m)} className="text-xs text-blue-500 hover:underline">編集</button>
                    <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 hover:underline">削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}

export default function MenusPage() {
  return <AuthGuard><MenusInner /></AuthGuard>;
}

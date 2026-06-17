import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import AuthNav from '@/components/AuthNav';

export const metadata: Metadata = {
  title: 'nail book — ネイリスト予約・売上管理',
  description: 'ネイリスト向けの予約・顧客・売上管理ツール',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="bg-white border-b border-pink-100 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-pink-500">💅 nail book</Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/" className="text-gray-600 hover:text-pink-500">ダッシュボード</Link>
              <Link href="/appointments" className="text-gray-600 hover:text-pink-500">予約</Link>
              <Link href="/customers" className="text-gray-600 hover:text-pink-500">顧客</Link>
              <Link href="/menus" className="text-gray-600 hover:text-pink-500">メニュー</Link>
              <Link href="/sales" className="text-gray-600 hover:text-pink-500">売上</Link>
            </nav>
            <AuthNav />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6">© 2026 nail book</footer>
      </body>
    </html>
  );
}

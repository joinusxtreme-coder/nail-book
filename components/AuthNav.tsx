'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/pricing" className="text-pink-500 font-bold text-xs border border-pink-300 px-2 py-1 rounded-full hover:bg-pink-50">
          ✨ Pro
        </Link>
        <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 text-xs">ログアウト</button>
      </div>
    );
  }

  return (
    <Link href="/login" className="text-sm text-pink-500 font-bold hover:text-pink-600">
      ログイン
    </Link>
  );
}

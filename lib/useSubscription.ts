'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useSubscription() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setEmail(user.email ?? null);

      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single();

      setIsPro(data?.status === 'active');
      setLoading(false);
    }
    check();
  }, []);

  return { isPro, userId, email, loading };
}

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { userId, email } = await req.json();
  if (!userId || !email) {
    return NextResponse.json({ error: 'userId and email required' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: email,
    metadata: { userId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    locale: 'ja',
  });

  return NextResponse.json({ url: session.url });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('consumer_credits')
      .select('free_tickets_remaining, paid_credits, subscription_credits, free_tickets_reset_at')
      .eq('customer_id', customerId)
      .single();

    if (error || !data) {
      // No credits record yet — return defaults
      return NextResponse.json({
        freeTickets: 3,
        paidCredits: 0,
        subscriptionCredits: 0,
        totalCredits: 3,
      });
    }

    return NextResponse.json({
      freeTickets: data.free_tickets_remaining ?? 0,
      paidCredits: data.paid_credits ?? 0,
      subscriptionCredits: data.subscription_credits ?? 0,
      totalCredits: (data.free_tickets_remaining ?? 0) + (data.paid_credits ?? 0) + (data.subscription_credits ?? 0),
      resetAt: data.free_tickets_reset_at,
    });
  } catch (error) {
    console.error('Balance check error:', error);
    return NextResponse.json({ error: 'Failed to check balance' }, { status: 500 });
  }
}

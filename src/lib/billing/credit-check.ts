import { createServerClient } from '@/lib/supabase';

export interface CreditCheckResult {
  allowed: boolean;
  creditSource: 'consumer_free' | 'consumer_paid' | 'consumer_subscription' | null;
  creditTransactionId: string | null;
  error?: string;
  errorCode?: 'NO_CREDITS' | 'DAILY_LIMIT_EXCEEDED' | 'AUTH_REQUIRED' | 'DB_ERROR';
}

export async function checkAndDeductCredit(params: {
  customerId?: string;
}): Promise<CreditCheckResult> {
  const supabase = createServerClient();
  if (!supabase) {
    return { allowed: false, creditSource: null, creditTransactionId: null, error: 'Database not configured', errorCode: 'DB_ERROR' };
  }

  const { customerId } = params;

  if (!customerId) {
    return {
      allowed: false,
      creditSource: null,
      creditTransactionId: null,
      error: 'ログインが必要です',
      errorCode: 'AUTH_REQUIRED',
    };
  }

  const dailyFreeLimit = 3;
  const resetHour = 0;

  // Find or create consumer_credits
  let consumerCreditId: string | null = null;

  const { data } = await supabase
    .from('consumer_credits')
    .select('id')
    .eq('customer_id', customerId)
    .single();
  consumerCreditId = data?.id || null;

  // Auto-create if not exists
  if (!consumerCreditId) {
    const nextReset = calcNextResetTime(resetHour);

    const { data: newCredits, error: insertError } = await supabase
      .from('consumer_credits')
      .insert({
        customer_id: customerId,
        free_tickets_remaining: dailyFreeLimit,
        free_tickets_reset_at: nextReset.toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !newCredits) {
      console.error('Failed to create consumer_credits:', insertError);
      return { allowed: false, creditSource: null, creditTransactionId: null, error: 'Failed to initialize credits', errorCode: 'DB_ERROR' };
    }
    consumerCreditId = newCredits.id;
  }

  // Deduct consumer credit (priority: free > subscription > paid)
  const { data: rpcData, error: rpcError } = await supabase.rpc('deduct_consumer_credit', {
    p_consumer_credit_id: consumerCreditId,
    p_vton_queue_id: null,
    p_free_ticket_limit: dailyFreeLimit,
    p_reset_hour: resetHour,
  });

  if (rpcError) {
    console.error('deduct_consumer_credit RPC error:', rpcError);
    return { allowed: false, creditSource: null, creditTransactionId: null, error: 'Failed to check credits', errorCode: 'DB_ERROR' };
  }

  const result = rpcData?.[0] || rpcData;
  if (!result?.success || result.source === 'none') {
    return {
      allowed: false,
      creditSource: null,
      creditTransactionId: null,
      error: 'クレジットが不足しています',
      errorCode: 'NO_CREDITS',
    };
  }

  return {
    allowed: true,
    creditSource: result.source as CreditCheckResult['creditSource'],
    creditTransactionId: result.tx_id,
  };
}

function calcNextResetTime(resetHour: number): Date {
  const nowUTC = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const nowJST = new Date(nowUTC.getTime() + jstOffset);

  const todayResetJST = new Date(nowJST);
  todayResetJST.setHours(resetHour, 0, 0, 0);

  const nextResetJST = nowJST >= todayResetJST
    ? new Date(todayResetJST.getTime() + 24 * 60 * 60 * 1000)
    : todayResetJST;

  return new Date(nextResetJST.getTime() - jstOffset);
}

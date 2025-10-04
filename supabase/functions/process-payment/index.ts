import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  subscriptionRequestId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  phoneNumber?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: PaymentRequest = await req.json();
    console.log('Processing payment:', payload);

    // Simulate payment processing based on gateway
    let transactionReference = '';
    let status = 'pending';

    switch (payload.paymentMethod) {
      case 'stripe':
        // Mock Stripe payment
        transactionReference = `stripe_mock_${Date.now()}`;
        status = 'completed';
        console.log('Mock Stripe payment processed');
        break;

      case 'cbe_birr':
        // Mock CBE Birr payment
        transactionReference = `cbe_mock_${Date.now()}`;
        status = 'pending';
        console.log('Mock CBE Birr payment initiated');
        break;

      case 'telebirr':
        // Mock Telebirr payment
        transactionReference = `telebirr_mock_${Date.now()}`;
        status = 'pending';
        console.log('Mock Telebirr payment initiated');
        break;

      default:
        throw new Error('Invalid payment method');
    }

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        subscription_request_id: payload.subscriptionRequestId,
        amount: payload.amount,
        currency: payload.currency,
        payment_method: payload.paymentMethod,
        transaction_reference: transactionReference,
        phone_number: payload.phoneNumber,
        status: status,
        payment_date: status === 'completed' ? new Date().toISOString() : null,
        metadata: {
          sandbox: true,
          processed_at: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      throw txError;
    }

    // If payment completed, update subscription request
    if (status === 'completed') {
      const { error: subError } = await supabase
        .from('subscription_requests')
        .update({ 
          status: 'approved',
          payment_status: 'completed'
        })
        .eq('id', payload.subscriptionRequestId);

      if (subError) {
        console.error('Subscription update error:', subError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction,
        message: status === 'completed' 
          ? 'Payment processed successfully' 
          : 'Payment initiated, pending confirmation'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

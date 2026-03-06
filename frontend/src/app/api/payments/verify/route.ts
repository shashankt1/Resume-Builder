import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// In-memory store for idempotency (use Redis/DB in production)
const processedPayments = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId,
      scans,
    } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    if (!userId || !scans) {
      return NextResponse.json({ error: 'Missing userId or scans' }, { status: 400 })
    }

    // Idempotency check
    if (processedPayments.has(razorpay_payment_id)) {
      return NextResponse.json({ success: true, message: 'Payment already processed', alreadyProcessed: true })
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 })
    }

    const signatureBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Mark as processed
    processedPayments.add(razorpay_payment_id)

    // Use admin client for server-side operations
    const supabase = await createAdminClient()

    // Add scans atomically using RPC or direct update
    // First try RPC function if it exists
    const { error: rpcError } = await supabase.rpc('add_scans', {
      p_user_id: userId,
      p_amount: scans,
    })

    if (rpcError) {
      // Fallback to direct update if RPC doesn't exist
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('scans, plan')
        .eq('id', userId)
        .single()

      if (currentProfile) {
        const newScans = (currentProfile.scans || 0) + scans
        await supabase
          .from('profiles')
          .update({ scans: newScans, plan: planId || currentProfile.plan })
          .eq('id', userId)
      }
    }

    // Log transaction
    await supabase.from('payment_transactions').insert({
      user_id: userId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      plan_id: planId,
      scans_added: scans,
      amount: body.amount || 0,
      status: 'completed',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and scans added',
      paymentId: razorpay_payment_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

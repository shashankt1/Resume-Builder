import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

// Store processed payment IDs for idempotency (in production, use database)
const processedPayments = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      credits,
    } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification fields' },
        { status: 400 }
      )
    }

    if (!userId || !credits) {
      return NextResponse.json(
        { error: 'Missing userId or credits' },
        { status: 400 }
      )
    }

    // Idempotency check - prevent double credit addition
    if (processedPayments.has(razorpay_payment_id)) {
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        alreadyProcessed: true,
      })
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET

    if (!secret) {
      return NextResponse.json(
        { error: 'Payment verification not configured. Contact support.' },
        { status: 500 }
      )
    }

    // Real signature verification using HMAC SHA256
    const signatureBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Mark payment as processed (idempotency)
    processedPayments.add(razorpay_payment_id)

    // Update user credits in Supabase
    const supabase = await createClient()

    // Try to update with service role key if available, otherwise use anon key
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (fetchError) {
      // If profile doesn't exist, create it
      if (fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            credits: credits,
          })

        if (insertError) {
          processedPayments.delete(razorpay_payment_id) // Rollback idempotency
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }
      } else {
        processedPayments.delete(razorpay_payment_id) // Rollback idempotency
        return NextResponse.json(
          { error: 'Failed to fetch user credits' },
          { status: 500 }
        )
      }
    } else {
      // Update existing profile
      const newCredits = (currentUser?.credits || 0) + credits

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId)

      if (updateError) {
        processedPayments.delete(razorpay_payment_id) // Rollback idempotency
        return NextResponse.json(
          { error: 'Failed to update credits' },
          { status: 500 }
        )
      }
    }

    // Log the transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: credits * 10, // Assuming 10 paise per credit
      credits: credits,
      status: 'completed',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and credits added',
      paymentId: razorpay_payment_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

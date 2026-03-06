import { NextRequest, NextResponse } from 'next/server'

let razorpayInstance: any = null

async function getRazorpayInstance() {
  if (!razorpayInstance) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    
    if (!keyId) {
      throw new Error('NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured')
    }
    
    const Razorpay = (await import('razorpay')).default
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret || '',
    })
  }
  return razorpayInstance
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, userId, planId, isYearly } = body

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Amount must be at least 100 paise' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const razorpay = await getRazorpayInstance()

    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `rcpt_${userId}_${Date.now()}`.substring(0, 40),
      notes: {
        userId,
        planId: planId || 'scans',
        isYearly: isYearly ? 'true' : 'false',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

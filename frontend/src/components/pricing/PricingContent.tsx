'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Check, Loader2, ArrowLeft } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 99,
    priceInPaise: 9900,
    features: [
      '10 AI Credits',
      '10 Resume Analyses',
      '5 Interview Prep Sessions',
      'Basic Support',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    credits: 50,
    price: 399,
    priceInPaise: 39900,
    popular: true,
    features: [
      '50 AI Credits',
      '50 Resume Analyses',
      '25 Interview Prep Sessions',
      'Priority Support',
      'Advanced Templates',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 200,
    price: 999,
    priceInPaise: 99900,
    features: [
      '200 AI Credits',
      'Unlimited Resume Analyses',
      'Unlimited Interview Prep',
      '24/7 Priority Support',
      'All Premium Templates',
      'Team Features',
    ],
  },
]

export function PricingContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [supabase])

  const handlePurchase = async (plan: typeof PRICING_PLANS[0]) => {
    if (!user) {
      window.location.href = '/auth'
      return
    }

    if (!scriptLoaded) {
      alert('Payment system is loading. Please try again.')
      return
    }

    setLoading(plan.id)

    try {
      // Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.priceInPaise,
          userId: user.id,
          planId: plan.id,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CraftlyCV',
        description: `${plan.name} - ${plan.credits} Credits`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // Verify payment
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              credits: plan.credits,
            }),
          })

          const verifyData = await verifyResponse.json()

          if (verifyResponse.ok && verifyData.success) {
            alert('Payment successful! Credits have been added to your account.')
            window.location.href = '/dashboard'
          } else {
            alert('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setLoading(null)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">CraftlyCV</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. All plans include access to our AI-powered features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? 'border-2 border-blue-600 shadow-lg scale-105'
                    : 'border'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500"> / one-time</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handlePurchase(plan)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Buy ${plan.credits} Credits`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center text-gray-500">
            <p>
              Secure payments powered by Razorpay. All transactions are encrypted and secure.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

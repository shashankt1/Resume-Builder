'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { FileText, Check, Loader2, ArrowLeft, Zap, Star } from 'lucide-react'
import { toast } from 'sonner'
import { PLANS, type PlanId } from '@/lib/plans'

declare global {
  interface Window {
    Razorpay: any
  }
}

function PricingContent() {
  const [user, setUser] = useState<any>(null)
  const [userPlan, setUserPlan] = useState<PlanId | null>(null)
  const [recommendedPlan, setRecommendedPlan] = useState<PlanId | null>(null)
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Get recommended plan from URL
    const planFromUrl = searchParams.get('plan') as PlanId | null
    if (planFromUrl && PLANS[planFromUrl]) {
      setRecommendedPlan(planFromUrl)
    }

    // Get user and profile
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        if (profile?.plan) {
          setUserPlan(profile.plan)
          // If no URL recommendation, recommend based on onboarding selection
          if (!planFromUrl) {
            setRecommendedPlan(profile.plan)
          }
        }
      }
    }
    loadUser()

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [searchParams, supabase])

  const handlePurchase = async (planId: PlanId) => {
    if (!user) {
      router.push('/auth?redirect=/pricing')
      return
    }

    if (planId === 'free') {
      toast.info('You already have the free plan!')
      return
    }

    if (!scriptLoaded) {
      toast.error('Payment system loading. Please wait...')
      return
    }

    const plan = PLANS[planId]
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
    const scans = isYearly ? plan.scansPerMonth * 12 : plan.scansPerMonth

    setLoading(planId)

    try {
      // Create order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price * 100, // Razorpay expects paise
          userId: user.id,
          planId,
          isYearly,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error)

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CraftlyCV',
        description: `${plan.name} Plan - ${scans === -1 ? 'Unlimited' : scans} Scans`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              planId,
              scans: scans === -1 ? 999 : scans,
            }),
          })

          const verifyData = await verifyRes.json()
          if (verifyRes.ok && verifyData.success) {
            toast.success('Payment successful! Scans added to your account.')
            router.push('/dashboard')
          } else {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        prefill: { email: user.email },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: () => setLoading(null),
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(null)
    }
  }

  const getYearlySavings = (plan: { monthlyPrice: number; yearlyPrice: number }) => {
    const monthlyCost = plan.monthlyPrice * 12
    if (monthlyCost === 0) return 0
    const savings = monthlyCost - plan.yearlyPrice
    return Math.round((savings / monthlyCost) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <nav className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">CraftlyCV</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Button>
                </Link>
              ) : (
                <Link href="/auth"><Button>Sign In</Button></Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Get more scans to analyze, tailor, and optimize your resume
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <Label htmlFor="billing" className={!isYearly ? 'font-medium' : 'text-muted-foreground'}>Monthly</Label>
            <Switch id="billing" checked={isYearly} onCheckedChange={setIsYearly} />
            <Label htmlFor="billing" className={isYearly ? 'font-medium' : 'text-muted-foreground'}>
              Yearly <Badge variant="secondary" className="ml-2">Save up to 17%</Badge>
            </Label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(PLANS).map((plan) => {
            const isRecommended = recommendedPlan === plan.id && plan.id !== 'free'
            const isCurrent = userPlan === plan.id
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
            const savings = getYearlySavings(plan)
            const isPopular = 'popular' in plan && plan.popular

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isPopular ? 'border-2 border-blue-600 shadow-lg' : ''
                } ${isRecommended ? 'ring-2 ring-purple-500' : ''}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                {isRecommended && !isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
                    <Star className="h-3 w-3 mr-1" /> Recommended for you
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrent && <Badge variant="secondary">Current</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>
                    )}
                    {isYearly && savings > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        Save {savings}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {plan.scansPerMonth === -1 ? 'Unlimited' : plan.scansPerMonth * (isYearly ? 12 : 1)} scans{isYearly ? '/year' : '/month'}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handlePurchase(plan.id as PlanId)}
                    disabled={loading === plan.id || isCurrent}
                  >
                    {loading === plan.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : plan.id === 'free' ? (
                      'Get Started'
                    ) : (
                      <><Zap className="mr-2 h-4 w-4" /> Upgrade Now</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <p className="text-center text-muted-foreground mt-12">
          Secure payments powered by Razorpay. All transactions are encrypted.
        </p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PricingContent />
    </Suspense>
  )
}

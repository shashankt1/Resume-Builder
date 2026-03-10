'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Zap, FileText, Crown, Star, Clock, Users, ArrowRight, Flame } from 'lucide-react'
import { toast } from 'sonner'

// ── Countdown Timer ────────────────────────────────────────────────────────────
function useCountdown() {
  const [time, setTime] = useState({ h: 11, m: 47, s: 23 })
  useEffect(() => {
    const iv = setInterval(() => {
      setTime(t => {
        let { h, m, s } = t
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) { h = 23; m = 59; s = 59 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])
  return time
}

function pad(n: number) { return String(n).padStart(2, '0') }

// ── Background ─────────────────────────────────────────────────────────────────
function PageBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#060c1a]" />
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.09]"
        style={{ background: 'radial-gradient(circle, #1E6FD9 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  )
}

// ── Spots counter ──────────────────────────────────────────────────────────────
const TOTAL_SPOTS = 500
const CLAIMED = 127 // hardcoded for social proof

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const countdown = useCountdown()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script')
      script.id = 'razorpay-script'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const handlePurchase = async (planId: string, amount: number) => {
    if (!user) { router.push('/auth?redirect=/pricing'); return }
    setLoading(planId)
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount, userId: user.id }),
      })
      const order = await res.json()
      if (!res.ok) throw new Error(order.error)

      const win = window as any
      if (!win.Razorpay) { toast.error('Payment gateway not loaded. Please refresh.'); setLoading(null); return }
      const rzp = new win.Razorpay({
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount, currency: order.currency || 'INR', order_id: order.orderId,
        name: 'CraftlyCV', description: `${planId} Plan`,
        handler: async (response: any) => {
          const verify = await fetch('/api/payment/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, userId: user.id, planId }),
          })
          if (verify.ok) { toast.success('Payment successful! Welcome to Pro 🎉'); router.push('/dashboard') }
          else toast.error('Verification failed')
        },
        prefill: { email: user.email },
        theme: { color: '#1E6FD9' },
      })
      rzp.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed')
    } finally { setLoading(null) }
  }

  const spotsLeft = TOTAL_SPOTS - CLAIMED

  return (
    <div className="min-h-screen relative text-white">
      <PageBg />
      <div className="relative z-10">

        {/* Nav */}
        <nav className="border-b border-white/6 bg-[#060c1a]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">CraftlyCV</span>
            </Link>
            <div className="flex items-center gap-3">
              {user
                ? <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all">Dashboard</Link>
                : <Link href="/auth" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all">Get Started Free</Link>
              }
            </div>
          </div>
        </nav>

        {/* Urgency Banner */}
        <div className="bg-gradient-to-r from-orange-600/20 via-orange-500/15 to-orange-600/20 border-b border-orange-500/20 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-orange-300 flex items-center justify-center gap-2 flex-wrap">
            <Flame className="h-4 w-4 text-orange-400 shrink-0" />
            <span>Founding Member offer ends in</span>
            <span className="font-black text-orange-200 tabular-nums bg-orange-500/15 px-3 py-0.5 rounded-lg border border-orange-500/20">
              {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </span>
            <span>· Only <strong className="text-white">{spotsLeft} of {TOTAL_SPOTS} spots</strong> remaining</span>
          </p>
        </div>

        {/* Header */}
        <section className="pt-16 pb-8 px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Zap className="h-4 w-4" /> Launch pricing · Prices go up April 1st
          </div>
          <h1 className="text-5xl font-black mb-4">
            Invest in your career.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">Not your coffee habit.</span>
          </h1>
          <p className="text-white/40 text-lg max-w-lg mx-auto">
            One job offer pays back this subscription 50× over. Start free, upgrade when you're serious.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">

            {/* FREE */}
            <div className="rounded-2xl p-7 border border-white/8 bg-white/3 flex flex-col">
              <div className="mb-6">
                <p className="text-white/50 text-sm font-semibold mb-1">Free</p>
                <div className="text-5xl font-black text-white mb-1">₹0</div>
                <p className="text-blue-400 text-sm font-bold">10 scans to start</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['ATS Resume Analyzer', 'Resume Builder (with watermark)', 'Career Roadmap', 'Score Share Card', '10 scans on signup'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/65">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth"
                className="block text-center py-3.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white font-bold text-sm transition-all">
                Get Started Free
              </Link>
            </div>

            {/* PRO — highlighted */}
            <div className="rounded-2xl border border-blue-500/40 bg-blue-600/8 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className="text-xs font-black bg-blue-600 text-white px-3 py-1 rounded-full">MOST POPULAR</span>
              </div>
              <div className="p-7 flex flex-col flex-1">
                <div className="mb-6">
                  <p className="text-white/50 text-sm font-semibold mb-1">Pro</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-black text-white">₹999</span>
                    <span className="text-white/40 text-sm">/month</span>
                  </div>
                  <p className="text-blue-400 text-sm font-bold">200 scans · Cancel anytime</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    'Everything in Free',
                    'Tailor to Job (AI rewrite)',
                    'Interview Prep Mode',
                    'LinkedIn Optimizer',
                    'AI Resume Rewrite',
                    'PDF + DOCX Download (no watermark)',
                    'Priority support',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-white/75">
                      <CheckCircle className="h-4 w-4 text-blue-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePurchase('pro', 99900)}
                  disabled={loading === 'pro'}
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base transition-all shadow-xl shadow-blue-500/25 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading === 'pro' ? 'Processing...' : <><Zap className="h-5 w-5" />Start Pro</>}
                </button>
              </div>
            </div>

            {/* FOUNDING MEMBER — urgency card */}
            <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-500/8 to-orange-600/4 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
              <div className="p-7 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black bg-orange-500/15 text-orange-400 border border-orange-500/25 px-3 py-1.5 rounded-full mb-3">
                    <Flame className="h-3.5 w-3.5" />🔥 {spotsLeft} spots left · Closes April 1
                  </div>
                  <p className="text-white/50 text-sm font-semibold mb-1">Founding Member</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-black text-white">₹299</span>
                    <span className="text-white/40 text-sm line-through">₹11,988/yr</span>
                  </div>
                  <p className="text-orange-400 text-sm font-black">One-time · Lifetime Pro access</p>
                </div>

                {/* Spots progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-white/40 mb-1.5">
                    <span>{CLAIMED} claimed</span>
                    <span>{spotsLeft} left</span>
                  </div>
                  <div className="w-full bg-white/8 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                      style={{ width: `${(CLAIMED / TOTAL_SPOTS) * 100}%` }} />
                  </div>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {[
                    'Everything in Pro — forever',
                    'Never pay monthly again',
                    'Lock in before price rises',
                    'All future features included',
                    'Priority email support',
                    'Founding member badge',
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-white/75">
                      <CheckCircle className="h-4 w-4 text-orange-400 shrink-0" />{f}
                    </li>
                  ))}
                </ul>

                {/* Countdown */}
                <div className="bg-orange-500/8 border border-orange-500/15 rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-orange-400/70 mb-1">Price increases in</p>
                  <p className="text-2xl font-black text-orange-300 tabular-nums">
                    {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                  </p>
                </div>

                <button
                  onClick={() => handlePurchase('founding', 29900)}
                  disabled={loading === 'founding'}
                  className="w-full py-4 rounded-xl font-black text-base transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', boxShadow: '0 8px 32px rgba(234,88,12,0.3)' }}>
                  {loading === 'founding' ? 'Processing...' : <><Crown className="h-5 w-5" />Claim Founding Member</>}
                </button>
                <p className="text-center text-xs text-white/25 mt-2">One-time payment · No subscription</p>
              </div>
            </div>
          </div>

          {/* Social proof strip */}
          <div className="max-w-5xl mx-auto mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" />No hidden fees</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" />Cancel anytime (Pro)</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" />Secure payment via Razorpay</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" />Instant access after payment</span>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 border-t border-white/6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-10">Common questions</h2>
            <div className="space-y-4">
              {[
                { q: 'What happens after my 10 free scans?', a: "You can still use the Resume Builder and Career Roadmap for free. To run more ATS analyses, tailor to jobs, or prep for interviews, you'll need to upgrade." },
                { q: "What's the difference between Pro and Founding Member?", a: "Pro is ₹999/month — cancel anytime. Founding Member is ₹299 once, gives you Pro access forever. After 500 spots fill up, this offer disappears permanently." },
                { q: 'Does the Founding Member deal really expire?', a: 'Yes. We are capping it at 500 users and closing it on April 1st when we officially launch. The regular Pro price is ₹999/month after that.' },
                { q: 'Can I get a refund?', a: 'If CraftlyCV does not work for you within 7 days, email us and we will refund you. No questions asked.' },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl p-6 border border-white/8 bg-white/3">
                  <p className="font-bold text-white mb-2">{item.q}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 text-center">
          <h2 className="text-4xl font-black mb-4">One job offer. That's all it takes.</h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto">
            The average salary bump from a job switch in India is ₹3–6L. CraftlyCV costs ₹299. Do the math.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => handlePurchase('founding', 29900)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', boxShadow: '0 8px 32px rgba(234,88,12,0.25)' }}>
              <Crown className="h-5 w-5" />Claim ₹299 Lifetime Deal
            </button>
            <Link href="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/8 border border-white/10 text-white font-bold text-lg transition-all hover:bg-white/12">
              Start Free First →
            </Link>
          </div>
          <p className="text-white/20 text-sm mt-4">{spotsLeft} founding spots left · Offer closes April 1</p>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/6 py-8 px-4 text-center">
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} CraftlyCV · Built for India's job seekers</p>
        </footer>
      </div>
    </div>
  )
}

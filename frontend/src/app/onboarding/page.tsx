'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Check, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { PLANS, type PlanId } from '@/lib/plans'
import { generateReferralCode } from '@/lib/utils'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUserId(user.id)

      // Check if already onboarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      if (profile?.plan) {
        router.push('/dashboard')
      }

      // Generate default username from email
      const emailPrefix = user.email?.split('@')[0] || ''
      setUsername(emailPrefix.replace(/[^a-z0-9]/gi, '').toLowerCase())
    }
    checkAuth()
  }, [router, supabase])

  const handleComplete = async () => {
    if (!userId) return
    setLoading(true)

    try {
      // Check username availability
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single()

      if (existing) {
        toast.error('Username is already taken')
        setLoading(false)
        return
      }

      // Create profile with 10 free scans
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        username: username.toLowerCase(),
        plan: selectedPlan,
        scans: 10, // 10 free scans on signup
        referral_code: generateReferralCode(),
        created_at: new Date().toISOString(),
        resume_updated_at: null,
      })

      if (error) {
        toast.error('Failed to create profile: ' + error.message)
        setLoading(false)
        return
      }

      toast.success('Welcome to CraftlyCV! You have 10 free scans.')
      
      // If they selected a paid plan, redirect to pricing
      if (selectedPlan !== 'free') {
        router.push('/pricing?plan=' + selectedPlan)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <nav className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">CraftlyCV</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Which plan interests you?</h1>
              <p className="text-muted-foreground">You'll start with 10 free scans. Upgrade anytime.</p>
            </div>

            <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanId)} className="grid md:grid-cols-2 gap-4">
              {Object.values(PLANS).map((plan) => (
                <div key={plan.id}>
                  <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                  <Label
                    htmlFor={plan.id}
                    className="flex flex-col h-full p-6 border-2 rounded-lg cursor-pointer hover:border-blue-200 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-950 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{plan.name}</span>
                      {'popular' in plan && plan.popular && <Badge>Popular</Badge>}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {plan.monthlyPrice === 0 ? 'Free' : `₹${plan.monthlyPrice}/mo`}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <ul className="space-y-2 text-sm">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-center">
              <Button size="lg" onClick={() => setStep(2)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Choose Your Username</h1>
              <p className="text-muted-foreground">This will be your public profile URL</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Profile URL</CardTitle>
                <CardDescription>craftlycv.in/u/{username || 'yourname'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="yourname"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">Only letters and numbers, max 20 characters</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Your Starter Pack</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ 10 free scans to get started</li>
                    <li>✓ ATS Resume Analyzer access</li>
                    <li>✓ Public profile page</li>
                    {selectedPlan !== 'free' && (
                      <li className="text-blue-600">✓ Redirecting to {PLANS[selectedPlan].name} upgrade</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleComplete} disabled={loading || !username}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</> : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

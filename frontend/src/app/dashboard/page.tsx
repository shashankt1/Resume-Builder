'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, Target, Sparkles, MessageSquare, Zap, LogOut, CreditCard, Share2, Clock, Sun, Moon, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { PLANS, type PlanId } from '@/lib/plans'
import { formatTimeAgo } from '@/lib/utils'

interface Profile {
  id: string
  username: string
  scans: number
  plan: PlanId
  referral_code: string
  resume_updated_at: string | null
}

interface Activity {
  id: string
  action_type: string
  scans_used: number
  created_at: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (!profile) { router.push('/onboarding'); return }
      setProfile(profile)

      // Check if admin
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (adminEmail && user.email === adminEmail) setIsAdmin(true)

      const { data: activities } = await supabase
        .from('scan_logs').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(5)

      setActivities(activities || [])
      setLoading(false)
    }
    loadData()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const copyReferralLink = () => {
    if (profile) {
      navigator.clipboard.writeText(`https://craftlycv.in/ref/${profile.referral_code}`)
      toast.success('Referral link copied!')
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      ats_analysis: 'ATS Resume Analysis',
      improve_resume: 'Resume Improvement',
      tailor_to_job: 'Tailored Resume',
      interview_prep: 'Interview Prep Session',
      linkedin_optimizer: 'LinkedIn Optimization',
    }
    return labels[action] || action
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <nav className="border-b bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </main>
      </div>
    )
  }

  const plan = profile?.plan ? PLANS[profile.plan] : PLANS.free
  const maxScans = plan.scansPerMonth === -1 ? 999 : plan.scansPerMonth
  const scansPercent = Math.min((profile?.scans || 0) / maxScans * 100, 100)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">CraftlyCV</span>
            </Link>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{profile?.scans || 0} scans</span>
              </div>

              {/* Dark/Light toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{plan.name}</Badge>
                        <span className="text-xs text-muted-foreground">{profile?.scans} scans left</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/pricing"><CreditCard className="mr-2 h-4 w-4" /> Buy Scans</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyReferralLink}>
                    <Share2 className="mr-2 h-4 w-4" /> Copy Referral Link
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="text-purple-600 dark:text-purple-400">
                          <Shield className="mr-2 h-4 w-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Your AI-powered resume toolkit</p>
        </div>

        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-4xl font-bold">{profile?.scans || 0}</div>
                <div className="text-blue-100">Scans Remaining</div>
                <Progress value={scansPercent} className="mt-2 h-2 bg-blue-400" />
              </div>
              <Link href="/pricing">
                <Button variant="secondary" size="lg">
                  <Zap className="mr-2 h-4 w-4" /> Get More Scans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/analyze">
            <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ATS Analyzer</CardTitle>
                    <Badge variant="secondary" className="mt-1">1 scan</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get your ATS compatibility score, keyword matches, and actionable improvements.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Card className={`h-full ${profile?.plan === 'free' || profile?.plan === 'starter' ? 'opacity-60' : 'hover:border-purple-300 hover:shadow-md cursor-pointer'}`}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tailor to Job</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">3 scans</Badge>
                    <Badge>Pro</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Paste a job description and our AI rewrites your resume to match in 30 seconds.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={`h-full ${profile?.plan === 'free' || profile?.plan === 'starter' ? 'opacity-60' : 'hover:border-green-300 hover:shadow-md cursor-pointer'}`}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Interview Prep</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">5 scans</Badge>
                    <Badge>Pro</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate tailored interview questions and practice with AI feedback.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <ul className="space-y-3">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className="font-medium">{getActionLabel(activity.action_type)}</span>
                      <span className="text-muted-foreground text-sm ml-2">-{activity.scans_used} scan{activity.scans_used > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatTimeAgo(activity.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No activity yet. Start by analyzing your resume!
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

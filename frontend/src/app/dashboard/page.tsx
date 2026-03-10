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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText, Target, Sparkles, MessageSquare, Zap, LogOut, CreditCard,
  Share2, Clock, Sun, Moon, Shield, Briefcase, Mic, Linkedin
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { PLANS, type PlanId } from '@/lib/plans'
import { formatTimeAgo } from '@/lib/utils'

interface Profile {
  id: string; username: string; scans: number; plan: PlanId
  referral_code: string; resume_updated_at: string | null
}
interface Activity { id: string; action_type: string; scans_used: number; created_at: string }

const getActionLabel = (a: string) => ({
  ats_analysis: 'ATS Resume Analysis', improve_resume: 'Resume Improvement',
  tailor_to_job: 'Tailored to Job', interview_prep: 'Interview Prep',
  linkedin_optimizer: 'LinkedIn Optimization', career_suggester: 'Career Suggestions',
  mock_interview: 'AI Mock Interview',
}[a] || a)

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
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profile) { router.push('/onboarding'); return }
      setProfile(profile)
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      if (adminEmail && user.email === adminEmail) setIsAdmin(true)
      const { data: acts } = await supabase.from('scan_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
      setActivities(acts || [])
      setLoading(false)
    }
    loadData()
  }, [router, supabase])

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/') }
  const copyReferralLink = () => {
    if (profile) { navigator.clipboard.writeText(`https://craftlycv.in/ref/${profile.referral_code}`); toast.success('Referral link copied!') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <nav className="border-b bg-white dark:bg-slate-900"><div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-10 w-10 rounded-full" /></div></nav>
        <main className="max-w-7xl mx-auto px-4 py-8"><Skeleton className="h-8 w-48 mb-8" /><div className="grid md:grid-cols-3 gap-6"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div></main>
      </div>
    )
  }

  const plan = profile?.plan ? PLANS[profile.plan] : PLANS.free
  const maxScans = plan.scansPerMonth === -1 ? 999 : plan.scansPerMonth
  const scansPercent = Math.min((profile?.scans || 0) / maxScans * 100, 100)
  const isPro = profile?.plan === 'pro' || profile?.plan === 'enterprise'

  const features = [
    { href: '/analyze', Icon: Target, iconBg: 'bg-blue-100 dark:bg-blue-900', iconColor: 'text-blue-600', title: 'ATS Analyzer', scans: '1 scan', pro: false, desc: 'Score your resume, get keyword matches and actionable improvements.', hover: 'hover:border-blue-300' },
    { href: '/tailor', Icon: Sparkles, iconBg: 'bg-purple-100 dark:bg-purple-900', iconColor: 'text-purple-600', title: 'Tailor to Job', scans: '3 scans', pro: true, desc: 'Paste any job description — AI rewrites your resume to match it perfectly.', hover: 'hover:border-purple-300' },
    { href: '/interview', Icon: MessageSquare, iconBg: 'bg-green-100 dark:bg-green-900', iconColor: 'text-green-600', title: 'Interview Prep', scans: '5 scans', pro: true, desc: 'Get 10 personalized questions. Answer by voice or text, get scored by AI.', hover: 'hover:border-green-300' },
    { href: '/linkedin', Icon: Linkedin, iconBg: 'bg-sky-100 dark:bg-sky-900', iconColor: 'text-sky-700', title: 'LinkedIn Analyzer', scans: '2 scans', pro: false, desc: 'Score your profile and get AI rewrites for headline and About section.', hover: 'hover:border-sky-300' },
    { href: '/career', Icon: Briefcase, iconBg: 'bg-indigo-100 dark:bg-indigo-900', iconColor: 'text-indigo-600', title: 'Career Suggester', scans: '2 scans', pro: false, desc: 'Get matched job roles, career path, courses, certifications & freelancing guide.', hover: 'hover:border-indigo-300' },
    { href: '/mock-interview', Icon: Mic, iconBg: 'bg-rose-100 dark:bg-rose-900', iconColor: 'text-rose-600', title: 'AI Mock Interview', scans: '5 scans', pro: true, desc: 'Live AI mock interview with voice or text. Real-time scoring and feedback.', hover: 'hover:border-rose-300' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2"><FileText className="h-8 w-8 text-blue-600" /><span className="text-xl font-bold">CraftlyCV</span></Link>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-full"><Zap className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium text-blue-600">{profile?.scans || 0} scans</span></div>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">{theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10"><AvatarImage src={user?.user_metadata?.avatar_url} /><AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <div className="flex items-center gap-2"><Badge variant="secondary" className="text-xs">{plan.name}</Badge><span className="text-xs text-muted-foreground">{profile?.scans} scans left</span></div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/pricing"><CreditCard className="mr-2 h-4 w-4" />Buy Scans</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={copyReferralLink}><Share2 className="mr-2 h-4 w-4" />Copy Referral Link</DropdownMenuItem>
                  {isAdmin && (<><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/admin" className="text-purple-600 dark:text-purple-400"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link></DropdownMenuItem></>)}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600"><LogOut className="mr-2 h-4 w-4" />Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8"><h1 className="text-2xl font-bold">Welcome back!</h1><p className="text-muted-foreground">Your AI-powered resume & career toolkit</p></div>

        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-4xl font-bold">{profile?.scans || 0}</div>
                <div className="text-blue-100">Scans Remaining</div>
                <Progress value={scansPercent} className="mt-2 h-2 bg-blue-400" />
              </div>
              <Link href="/pricing"><Button variant="secondary" size="lg"><Zap className="mr-2 h-4 w-4" />Get More Scans</Button></Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {features.map((f) => {
            const locked = f.pro && !isPro
            const card = (
              <Card className={`h-full transition-all ${locked ? 'opacity-60 cursor-not-allowed' : `cursor-pointer ${f.hover} hover:shadow-md`}`}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${f.iconBg} rounded-lg`}><f.Icon className={`h-6 w-6 ${f.iconColor}`} /></div>
                    <div>
                      <CardTitle className="text-lg">{f.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{f.scans}</Badge>
                        {f.pro && <Badge className="bg-purple-600 text-white">Pro</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent><CardDescription>{f.desc}</CardDescription></CardContent>
              </Card>
            )
            return locked ? <div key={f.href}>{card}</div> : <Link key={f.href} href={f.href}>{card}</Link>
          })}
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" />Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div><span className="font-medium">{getActionLabel(a.action_type)}</span><span className="text-muted-foreground text-sm ml-2">-{a.scans_used} scan{a.scans_used > 1 ? 's' : ''}</span></div>
                    <span className="text-sm text-muted-foreground">{formatTimeAgo(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground text-center py-8">No activity yet. Start by analyzing your resume!</p>}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileText, ArrowLeft, Loader2, Zap, Sun, Moon, CheckCircle, AlertCircle, TrendingUp, Linkedin } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface SectionScore { section: string; score: number; current: string; suggestion: string }
interface LinkedInResult {
  overallScore: number
  summary: string
  sectionScores: SectionScore[]
  topFixes: string[]
  keywordsMissing: string[]
}

export default function LinkedInPage() {
  const [profileText, setProfileText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LinkedInResult | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userScans, setUserScans] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('scans').eq('id', user.id).single()
      if (profile) setUserScans(profile.scans)
    }
    check()
  }, [])

  const analyze = async () => {
    if (!profileText.trim() || profileText.length < 100) { toast.error('Paste more LinkedIn profile content (at least 100 characters)'); return }
    if (userScans < 2) { toast.error('Need 2 scans'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setUserScans(prev => prev - 2)
      toast.success('LinkedIn profile analyzed!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    } finally { setLoading(false) }
  }

  const getScoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600'
  const getBarColor = (s: number) => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" /><span className="text-xl font-bold">CraftlyCV</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-full">
              <Zap className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium text-blue-600">{userScans} scans</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link href="/dashboard"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg"><Linkedin className="h-6 w-6 text-sky-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">LinkedIn Profile Analyzer</h1>
            <p className="text-muted-foreground">Score your profile and get AI rewrite suggestions · 2 scans</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paste Your LinkedIn Profile</CardTitle>
                <CardDescription>
                  Go to your LinkedIn profile → copy your Headline, About, and top 2-3 Experience entries → paste below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg p-3 mb-3 text-sm text-sky-700 dark:text-sky-300">
                  <p className="font-medium mb-1">How to copy your LinkedIn profile:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Open your LinkedIn profile in browser</li>
                    <li>Select all text from Headline to Experience</li>
                    <li>Copy (Ctrl+A, Ctrl+C) and paste below</li>
                  </ol>
                </div>
                <Textarea
                  placeholder="Paste your LinkedIn profile text here...&#10;&#10;Example:&#10;John Doe&#10;Senior Software Engineer at Google | Building the future&#10;&#10;About&#10;Passionate software engineer with 5+ years..."
                  value={profileText}
                  onChange={e => setProfileText(e.target.value)}
                  className="min-h-[280px] resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">{profileText.length} characters (min 100)</p>
              </CardContent>
            </Card>

            <Button onClick={analyze} disabled={loading || profileText.length < 100 || userScans < 2} className="w-full bg-sky-600 hover:bg-sky-700 text-white" size="lg">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : <><Linkedin className="mr-2 h-4 w-4" />Analyze Profile (2 scans)</>}
            </Button>
          </div>

          <div>
            {result ? (
              <div className="space-y-4">
                <Card className={result.overallScore >= 80 ? 'bg-green-50 dark:bg-green-950/20 border-green-300' : result.overallScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300' : 'bg-red-50 dark:bg-red-950/20 border-red-300'}>
                  <CardContent className="py-6 text-center">
                    <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>{result.overallScore}</div>
                    <div className={`text-lg font-medium ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore >= 80 ? 'All-Star Profile' : result.overallScore >= 60 ? 'Intermediate' : 'Needs Work'}
                    </div>
                    <Progress value={result.overallScore} className="mt-3 h-3" />
                    <p className="text-sm text-muted-foreground mt-3">{result.summary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Section Scores</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.sectionScores.map((s, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{s.section}</span>
                            <span className={`text-sm font-bold ${getScoreColor(s.score)}`}>{s.score}/100</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${getBarColor(s.score)} transition-all`} style={{ width: `${s.score}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{s.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2 text-red-600"><AlertCircle className="h-4 w-4" /> Top Fixes</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.topFixes.map((fix, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />{fix}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2 text-sky-600"><CheckCircle className="h-4 w-4" /> Missing Keywords</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.keywordsMissing.map((kw, i) => (
                        <Badge key={i} variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">{kw}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground py-12">
                  <Linkedin className="h-14 w-14 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Paste your LinkedIn profile content</p>
                  <p className="text-sm mt-1">We'll score and suggest improvements for every section</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

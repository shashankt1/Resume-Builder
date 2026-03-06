'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, ArrowLeft, Target, Loader2, CheckCircle, AlertCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { SCAN_COSTS } from '@/lib/plans'

interface ATSResult {
  score: number
  keywordMatches: string[]
  missingKeywords: string[]
  strengths: string[]
  improvements: string[]
  summary: string
}

export default function AnalyzePage() {
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ATSResult | null>(null)
  const [userScans, setUserScans] = useState<number>(0)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?redirect=/analyze')
        return
      }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('scans')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserScans(profile.scans)
      }
    }
    checkAuth()
  }, [router, supabase])

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume text')
      return
    }

    if (userScans < SCAN_COSTS.ats_analysis) {
      toast.error('Not enough scans. Please upgrade your plan.')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data)
      setUserScans(prev => prev - SCAN_COSTS.ats_analysis)
      toast.success('Resume analyzed successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900'
    return 'bg-red-100 dark:bg-red-900'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Work'
    return 'Poor'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">CraftlyCV</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">{userScans} scans</span>
              </div>
              <Link href="/dashboard">
                <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ATS Resume Analyzer</h1>
            <p className="text-muted-foreground">Get your ATS compatibility score and improvements</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Your Resume</CardTitle>
              <CardDescription>Paste your resume text below for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here...

Include your:
- Contact information
- Professional summary
- Work experience
- Education
- Skills"
                className="min-h-[400px] font-mono text-sm"
              />
              <Button
                onClick={analyzeResume}
                disabled={loading || !resumeText.trim() || userScans < SCAN_COSTS.ats_analysis}
                className="w-full mt-4"
                size="lg"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Target className="mr-2 h-4 w-4" /> Analyze Resume ({SCAN_COSTS.ats_analysis} scan)</>
                )}
              </Button>
              {userScans < SCAN_COSTS.ats_analysis && (
                <p className="text-red-500 text-sm mt-2 text-center">
                  Not enough scans. <Link href="/pricing" className="underline">Upgrade now</Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Score Card */}
                <Card className={getScoreBg(result.score)}>
                  <CardContent className="py-6">
                    <div className="text-center">
                      <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}
                      </div>
                      <div className={`text-xl font-medium ${getScoreColor(result.score)}`}>
                        {getScoreLabel(result.score)}
                      </div>
                      <Progress value={result.score} className="mt-4 h-3" />
                      <p className="mt-4 text-muted-foreground">{result.summary}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Keywords */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center text-green-600">
                        <TrendingUp className="mr-2 h-4 w-4" /> Keywords Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {result.keywordMatches.slice(0, 8).map((kw, i) => (
                          <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center text-red-600">
                        <TrendingDown className="mr-2 h-4 w-4" /> Missing Keywords
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {result.missingKeywords.slice(0, 8).map((kw, i) => (
                          <Badge key={i} variant="secondary" className="bg-red-100 text-red-800">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <CheckCircle className="mr-2 h-5 w-5" /> Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Improvements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-600">
                      <AlertCircle className="mr-2 h-5 w-5" /> Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center text-muted-foreground py-12">
                  <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg">Paste your resume and click "Analyze"</p>
                  <p className="text-sm">to get your ATS compatibility score</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

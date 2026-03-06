'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowLeft, Target, Loader2, CheckCircle, AlertCircle, Zap, TrendingUp, TrendingDown, Upload, X, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
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
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ATSResult | null>(null)
  const [userScans, setUserScans] = useState<number>(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

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
        setUserScans(profile.scans ?? 10)
      }
      setPageLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  const validateFile = (f: File): string => {
    if (!ACCEPTED_TYPES.includes(f.type)) return 'Only PDF or DOCX files are accepted.'
    if (f.size > 5 * 1024 * 1024) return 'File must be under 5MB.'
    return ''
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) { setFileError(err); return }
    setFileError('')
    setFile(f)
    setResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const analyzeResume = async () => {
    if (!file) { toast.error('Please upload your resume first'); return }
    if (userScans < SCAN_COSTS.ats_analysis) {
      toast.error('Not enough scans. Please upgrade your plan.')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId!)

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analysis failed')

      setResult(data)
      setUserScans(prev => prev - SCAN_COSTS.ats_analysis)
      toast.success('Resume analyzed successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const getScoreLabel = (score: number) => score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Work' : 'Poor'
  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB'

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
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {pageLoading ? '...' : userScans} scans
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Link href="/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
                </Button>
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
            <p className="text-muted-foreground">Upload your resume to get your ATS compatibility score</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Resume</CardTitle>
              <CardDescription>Upload a PDF or DOCX file (max 5MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onClick={() => !file && inputRef.current?.click()}
                className={[
                  'border-2 border-dashed rounded-xl p-10 text-center transition-all',
                  dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : '',
                  file
                    ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'
                ].join(' ')}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {!file ? (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-base font-semibold mb-1">
                      {dragging ? 'Drop it here!' : 'Drag & drop your resume'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">PDF or DOCX · Max 5MB</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                    >
                      Browse files
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Ready to analyze</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null) }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {fileError && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {fileError}
                </p>
              )}

              <Button
                onClick={analyzeResume}
                disabled={loading || !file || userScans < SCAN_COSTS.ats_analysis}
                className="w-full mt-4"
                size="lg"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Target className="mr-2 h-4 w-4" /> Analyze Resume ({SCAN_COSTS.ats_analysis} scan)</>
                )}
              </Button>

              {!pageLoading && userScans < SCAN_COSTS.ats_analysis && (
                <p className="text-red-500 text-sm mt-2 text-center">
                  Not enough scans.{' '}
                  <Link href="/pricing" className="underline font-medium">Upgrade now</Link>
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {result ? (
              <>
                <Card className={result.score >= 80 ? 'bg-green-50 dark:bg-green-950/30' : result.score >= 60 ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'bg-red-50 dark:bg-red-950/30'}>
                  <CardContent className="py-6 text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>{result.score}</div>
                    <div className={`text-xl font-medium mt-1 ${getScoreColor(result.score)}`}>{getScoreLabel(result.score)}</div>
                    <Progress value={result.score} className="mt-4 h-3" />
                    <p className="mt-4 text-muted-foreground text-sm">{result.summary}</p>
                  </CardContent>
                </Card>

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
                          <Badge key={i} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">{kw}</Badge>
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
                          <Badge key={i} variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

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
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                          <span className="text-sm">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

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
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 shrink-0" />
                          <span className="text-sm">{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center text-muted-foreground py-12">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Upload your resume and click "Analyze"</p>
                  <p className="text-sm mt-1">to get your ATS compatibility score</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

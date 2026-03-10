'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import {
  FileText, ArrowLeft, Zap, Sun, Moon, Upload, X, CheckCircle,
  AlertCircle, Target, Sparkles, ChevronRight, Download, Share2,
  FileDown, FileType, RotateCcw, TrendingUp, BookOpen, Award,
  Briefcase, Code2, Star, ArrowRight, Edit3, RefreshCw, Loader2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ATSResult {
  score: number
  detectedField: string
  experienceYears: number
  keywordMatches: string[]
  missingKeywords: string[]
  strengths: string[]
  improvements: string[]
  opportunities: Opportunity[]
  summary: string
  projectedScore: number
  scorePercentile: number
  strengthStatement: string
  realWorldContext: string
}

interface Opportunity {
  icon: string
  title: string
  whatsHappening: string
  theFix: string
  impact: number
  proOnly: boolean
}

interface RoadmapStep {
  week: string
  action: string
  resource: string
  resourceUrl: string
  free: boolean
}

interface Roadmap {
  currentGoal: string
  targetGoal: string
  timeframe: string
  steps: RoadmapStep[]
  certifications: string[]
  dsaTopics: string[] | null
  salaryJump: string
}

interface ImproveResult {
  improvedText: string
  docxBase64: string
  pdfHtmlBase64: string
}

type Stage = 'upload' | 'scanning' | 'prewarm' | 'results'

const SCAN_MESSAGES = [
  'Reading your resume structure...',
  'Checking ATS compatibility...',
  'Analyzing keyword alignment...',
  'Measuring recruiter readability...',
  'Benchmarking against top candidates...',
  'Calculating your score...',
]

const GOAL_OPTIONS = [
  'Get into a top tech company (Google/Amazon/Microsoft)',
  'Switch to Data Science / AI / ML',
  'Switch to Product Management',
  'Get into a startup as early employee',
  'Land a remote job internationally',
  'Become a Freelancer / Consultant',
  'Get promoted in current company',
  'Switch industries entirely',
  'Get first job as a fresher',
  'Go abroad (US/UK/Canada/Germany)',
]

// ─── Score helpers ─────────────────────────────────────────────────────────────
function getScoreMeta(score: number) {
  if (score >= 90) return { label: 'Elite Level', color: '#27AE60', bg: 'from-emerald-500 to-green-600', ring: 'ring-emerald-400', msg: "You're in the top 5% of resumes we've analyzed. Here's how to make it perfect." }
  if (score >= 80) return { label: 'Interview Ready', color: '#27AE60', bg: 'from-green-500 to-teal-600', ring: 'ring-green-400', msg: "You're ahead of most applicants. Three refinements away from the top tier." }
  if (score >= 70) return { label: 'Almost There', color: '#F39C12', bg: 'from-amber-400 to-orange-500', ring: 'ring-amber-400', msg: "Strong foundation. The gap between here and the shortlist is smaller than you think." }
  if (score >= 60) return { label: 'Getting Closer', color: '#F39C12', bg: 'from-orange-400 to-amber-500', ring: 'ring-orange-400', msg: "You're being seen but filtered out before human eyes reach you. Fixable today." }
  if (score >= 50) return { label: 'Needs Attention', color: '#E74C3C', bg: 'from-red-400 to-rose-500', ring: 'ring-red-400', msg: "Now you know why the callbacks weren't coming. This explains everything — and everything here is fixable." }
  return { label: 'Fresh Start', color: '#E74C3C', bg: 'from-rose-500 to-red-600', ring: 'ring-rose-400', msg: "This score is actually good news. You now have the clearest possible picture of exactly what to fix." }
}

// ─── Animated Score Ring ────────────────────────────────────────────────────────
function ScoreRing({ score, size = 200 }: { score: number; size?: number }) {
  const [displayed, setDisplayed] = useState(0)
  const meta = getScoreMeta(score)
  const radius = (size - 20) / 2
  const circ = 2 * Math.PI * radius
  const progress = (displayed / 100) * circ

  useEffect(() => {
    let frame: number
    let current = 0
    const step = () => {
      current += 1.5
      if (current >= score) { setDisplayed(score); return }
      setDisplayed(Math.floor(current))
      frame = requestAnimationFrame(step)
    }
    const timeout = setTimeout(() => { frame = requestAnimationFrame(step) }, 300)
    return () => { clearTimeout(timeout); cancelAnimationFrame(frame) }
  }, [score])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-slate-700" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={meta.color} strokeWidth="12"
          strokeDasharray={`${progress} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.05s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black" style={{ color: meta.color }}>{displayed}</span>
        <span className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: meta.color }}>{meta.label}</span>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [stage, setStage] = useState<Stage>('upload')
  const [scanMsgIdx, setScanMsgIdx] = useState(0)
  const [result, setResult] = useState<ATSResult | null>(null)
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loadingRoadmap, setLoadingRoadmap] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [showGoalEditor, setShowGoalEditor] = useState(false)
  const [activeTab, setActiveTab] = useState<'score' | 'roadmap' | 'resume'>('score')
  const [improving, setImproving] = useState(false)
  const [improveResult, setImproveResult] = useState<ImproveResult | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userScans, setUserScans] = useState(0)
  const [userPlan, setUserPlan] = useState('free')
  const [pageLoading, setPageLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const isPro = userPlan === 'pro' || userPlan === 'enterprise'

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth?redirect=/analyze'); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('scans, plan').eq('id', user.id).single()
      if (profile) { setUserScans(profile.scans ?? 10); setUserPlan(profile.plan ?? 'free') }
      setPageLoading(false)
    }
    check()
  }, [])

  // Scan message rotation
  useEffect(() => {
    if (stage !== 'scanning') return
    const iv = setInterval(() => setScanMsgIdx(i => (i + 1) % SCAN_MESSAGES.length), 2200)
    return () => clearInterval(iv)
  }, [stage])

  const handleFile = (f: File) => {
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) {
      toast.error('Only PDF or DOCX files accepted'); return
    }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setFile(f); setResult(null); setRoadmap(null); setImproveResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const analyzeResume = async () => {
    if (!file) { toast.error('Upload your resume first'); return }
    if (userScans < 1) { toast.error('Not enough scans'); return }
    setStage('scanning')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId!)
      const res = await fetch('/api/ai/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      setSelectedGoal(data.detectedField || '')
      setUserScans(prev => prev - 1)
      setStage('prewarm')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
      setStage('upload')
    }
  }

  const fetchRoadmap = async (goal: string) => {
    if (!result || !userId) return
    setLoadingRoadmap(true)
    try {
      const res = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, detectedField: result.detectedField, targetGoal: goal, score: result.score }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRoadmap(data)
    } catch {
      toast.error('Failed to generate roadmap')
    } finally { setLoadingRoadmap(false) }
  }

  const handleGoalChange = (goal: string) => {
    setSelectedGoal(goal)
    setShowGoalEditor(false)
    fetchRoadmap(goal)
  }

  const improveResume = async () => {
    if (!result || !file) return
    if (!isPro) { toast.error('Upgrade to Pro to use Resume Improvement'); return }
    if (userScans < 2) { toast.error('Need 2 scans to improve resume'); return }
    setImproving(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId!)
      formData.append('improvements', JSON.stringify(result.improvements))
      const res = await fetch('/api/ai/improve', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImproveResult(data)
      setUserScans(prev => prev - 2)
      setActiveTab('resume')
      toast.success('Resume improved! Preview below.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Improvement failed')
    } finally { setImproving(false) }
  }

  const downloadDocx = () => {
    if (!improveResult?.docxBase64) return
    const bytes = Uint8Array.from(atob(improveResult.docxBase64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'improved-resume.docx'; a.click()
  }

  const downloadPdf = () => {
    if (!improveResult?.pdfHtmlBase64) return
    const html = atob(improveResult.pdfHtmlBase64)
    const w = window.open('', '_blank')
    if (!w) { toast.error('Allow popups to download PDF'); return }
    w.document.write(html); w.document.close(); w.focus()
    setTimeout(() => w.print(), 500)
  }

  const shareScore = () => {
    const meta = getScoreMeta(result?.score || 0)
    const text = `I just analyzed my resume on CraftlyCV and scored ${result?.score}/100 — ${meta.label}! 🎯\nCheck yours free at craftlycv.in`
    if (navigator.share) {
      navigator.share({ title: 'My CraftlyCV Score', text, url: 'https://craftlycv.in' })
    } else {
      navigator.clipboard.writeText(text)
      toast.success('Score copied to clipboard!')
    }
  }

  const formatSize = (b: number) => b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB'

  // ── SCANNING SCREEN ───────────────────────────────────────────────────────────
  if (stage === 'scanning') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-blue-500/40 animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-4 rounded-full bg-blue-600 flex items-center justify-center">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Analyzing Your Resume</h2>
          <p className="text-blue-300 text-lg font-medium mb-8 h-7 transition-all duration-500">
            {SCAN_MESSAGES[scanMsgIdx]}
          </p>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-orange-400 rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
          <p className="text-white/40 text-sm mt-4">This takes about 30 seconds</p>
        </div>
      </div>
    )
  }

  // ── PRE-WARM SCREEN ───────────────────────────────────────────────────────────
  if (stage === 'prewarm') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
            We've finished analyzing your resume.
          </h2>
          <div className="text-white/70 text-lg leading-relaxed space-y-4 mb-10">
            <p>Before we show you the results — know this:</p>
            <p className="text-white/90 font-medium">
              Every resume we've ever improved started exactly where yours is right now.
            </p>
            <p>What you're about to see isn't a judgment.</p>
            <p className="text-orange-400 font-semibold text-xl">It's a map.</p>
          </div>
          <Button
            onClick={() => setStage('results')}
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-10 py-6 text-lg rounded-2xl font-semibold shadow-2xl"
          >
            Show Me My Results <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    )
  }

  // ── UPLOAD SCREEN ─────────────────────────────────────────────────────────────
  if (stage === 'upload' || !result) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0a0f1e]">
        {/* Nav */}
        <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">CraftlyCV</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600">{pageLoading ? '...' : userScans} scans</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Target className="h-4 w-4" />
              The toughest ATS analyzer available
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4">
              Find out exactly why<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                you're not getting callbacks
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              We analyze your resume the same way ATS systems at Google, TCS, and 500+ companies do — then give you the exact fixes.
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => !file && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : file ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {file ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-sm text-slate-500">{formatSize(file.size)} · Ready to analyze</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 hover:bg-red-50 hover:text-red-500"
                    onClick={e => { e.stopPropagation(); setFile(null) }}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {dragging ? 'Drop it here!' : 'Drag & drop your resume'}
                  </p>
                  <p className="text-slate-500 text-sm">PDF or DOCX · Max 5MB</p>
                  <Button variant="outline" size="sm" className="mt-4"
                    onClick={e => { e.stopPropagation(); inputRef.current?.click() }}>
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            <Button
              onClick={analyzeResume}
              disabled={!file || userScans < 1 || pageLoading}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
              size="lg"
            >
              <Target className="mr-2 h-5 w-5" />
              Analyze My Resume — 1 Scan
            </Button>

            {userScans < 1 && !pageLoading && (
              <p className="text-center text-red-500 text-sm mt-3">
                No scans left. <Link href="/pricing" className="underline font-semibold">Get more scans →</Link>
              </p>
            )}

            {/* Trust signals */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-6 text-xs text-slate-400">
              <span>🔒 Resume never stored after analysis</span>
              <span>⚡ Results in ~30 seconds</span>
              <span>🎯 Toughest ATS scoring available</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULTS SCREEN ────────────────────────────────────────────────────────────
  const meta = getScoreMeta(result.score)

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0a0f1e]">
      {/* Nav */}
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">CraftlyCV</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-full">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">{userScans} scans</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setStage('upload'); setResult(null); setFile(null); setImproveResult(null); setRoadmap(null) }}>
              <RotateCcw className="mr-2 h-4 w-4" />New Scan
            </Button>
          </div>
        </div>
      </nav>

      {/* Strength Statement Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 py-4 text-center">
        <p className="text-sm md:text-base font-medium max-w-3xl mx-auto">
          💪 <strong>Your foundation is solid.</strong> {result.strengthStatement}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0">
            {[
              { id: 'score', label: '📊 Score & Opportunities', },
              { id: 'roadmap', label: '🗺️ Career Roadmap', },
              { id: 'resume', label: '✨ Improved Resume', },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  if (tab.id === 'roadmap' && !roadmap && !loadingRoadmap) fetchRoadmap(selectedGoal || result.detectedField)
                }}
                className={`px-5 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── TAB: SCORE & OPPORTUNITIES ── */}
        {activeTab === 'score' && (
          <div className="grid lg:grid-cols-5 gap-6">

            {/* LEFT — Score Panel */}
            <div className="lg:col-span-2 space-y-5">

              {/* Score Card */}
              <div className={`bg-gradient-to-br ${meta.bg} rounded-3xl p-8 text-white shadow-xl`}>
                <div className="flex flex-col items-center">
                  <ScoreRing score={result.score} size={180} />
                  <p className="text-white/90 text-center text-sm mt-4 leading-relaxed">{meta.msg}</p>
                </div>

                {/* Projected score */}
                <div className="mt-6 bg-white/15 rounded-2xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">After fixes, your score becomes</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${result.score}%` }} />
                    </div>
                    <span className="text-white font-bold text-lg shrink-0">{result.score}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-yellow-300 rounded-full transition-all" style={{ width: `${result.projectedScore}%` }} />
                    </div>
                    <span className="text-yellow-300 font-bold text-lg shrink-0">{result.projectedScore} ✦</span>
                  </div>
                  <p className="text-white/60 text-xs mt-2">Top {100 - result.scorePercentile}% of all resumes in your field</p>
                </div>

                {/* Share */}
                <Button onClick={shareScore} className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl" variant="outline">
                  <Share2 className="mr-2 h-4 w-4" /> Share My Score
                </Button>
              </div>

              {/* Real World Context */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">What this means in real terms</p>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{result.realWorldContext}</p>
              </div>

              {/* Keywords Found */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Keywords Found ({result.keywordMatches.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywordMatches.map((kw, i) => (
                    <span key={i} className="text-xs bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">{kw}</span>
                  ))}
                </div>
              </div>

              {/* Keywords Missing */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Not Yet Included ({result.missingKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((kw, i) => (
                    <span key={i} className="text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Opportunities + Strengths */}
            <div className="lg:col-span-3 space-y-5">

              {/* Strengths */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4" /> What's Working In Your Favour
                </p>
                <ul className="space-y-3">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Your Biggest Opportunities</p>
                {result.opportunities.map((opp, i) => (
                  <div key={i} className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm transition-all ${opp.proOnly && !isPro ? 'border-purple-200 dark:border-purple-800' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200'}`}>
                    <div className="flex items-start gap-4">
                      <span className="text-2xl shrink-0">{opp.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white">{opp.title}</p>
                          {opp.proOnly && !isPro && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs">Pro</Badge>}
                          <span className="text-xs text-orange-600 font-semibold ml-auto">+{opp.impact} pts potential</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">{opp.whatsHappening}</p>
                        {opp.proOnly && !isPro ? (
                          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 flex items-center justify-between gap-3">
                            <p className="text-xs text-purple-700 dark:text-purple-300">🔒 The exact fix is available on Pro</p>
                            <Link href="/pricing">
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs shrink-0">Unlock Fix</Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">The fix:</p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{opp.theFix}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Improve Resume CTA */}
              <div className={`rounded-2xl p-6 border ${isPro ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">AI-Powered Resume Rewrite</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      {isPro
                        ? 'Let AI apply every fix above and generate a fully improved resume you can download as PDF or DOCX. · 2 scans'
                        : 'Upgrade to Pro — AI rewrites your entire resume applying all improvements, downloadable as PDF or DOCX.'}
                    </p>
                    {improveResult ? (
                      <div className="flex gap-3 flex-wrap">
                        <Button onClick={downloadPdf} className="bg-red-600 hover:bg-red-700 text-white">
                          <FileDown className="mr-2 h-4 w-4" />Download PDF
                        </Button>
                        <Button onClick={downloadDocx} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <FileType className="mr-2 h-4 w-4" />Download DOCX
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('resume')}>
                          <FileText className="mr-2 h-4 w-4" />Preview
                        </Button>
                      </div>
                    ) : isPro ? (
                      <Button onClick={improveResume} disabled={improving || userScans < 2} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {improving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rewriting your resume...</> : <><Sparkles className="mr-2 h-4 w-4" />Improve & Download (2 scans)</>}
                      </Button>
                    ) : (
                      <Link href="/pricing">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white">Upgrade to Pro →</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: CAREER ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Goal Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Your target goal</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedGoal || result.detectedField}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Detected from your resume · <span className="text-blue-600 cursor-pointer" onClick={() => setShowGoalEditor(v => !v)}>Change goal</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowGoalEditor(v => !v)} className="shrink-0">
                  <Edit3 className="h-4 w-4 mr-1" />Change
                </Button>
              </div>
              {showGoalEditor && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Where do you want to go?</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {GOAL_OPTIONS.map(g => (
                      <button
                        key={g}
                        onClick={() => handleGoalChange(g)}
                        className={`text-left text-sm px-4 py-3 rounded-xl border transition-all ${selectedGoal === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-300'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Or type your own goal..."
                      value={customGoal}
                      onChange={e => setCustomGoal(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-400"
                    />
                    <Button size="sm" onClick={() => customGoal.trim() && handleGoalChange(customGoal.trim())} className="bg-blue-600 text-white">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {loadingRoadmap ? (
              <div className="text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-500">Building your personalized roadmap...</p>
              </div>
            ) : roadmap ? (
              <>
                {/* Roadmap Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-blue-200 text-sm font-medium mb-1">Your career roadmap</p>
                      <p className="text-2xl font-black">{roadmap.currentGoal} → {roadmap.targetGoal}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-200 text-sm">Estimated timeline</p>
                      <p className="text-xl font-bold">{roadmap.timeframe}</p>
                      {roadmap.salaryJump && <p className="text-yellow-300 text-sm mt-1">💰 {roadmap.salaryJump}</p>}
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {roadmap.steps.map((step, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4">
                      <div className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{i + 1}</div>
                        {i < roadmap.steps.length - 1 && <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700 mx-auto mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">{step.week}</span>
                          <Badge className={step.free ? 'bg-green-100 text-green-700 text-xs' : 'bg-slate-100 text-slate-600 text-xs'}>{step.free ? 'Free' : 'Paid'}</Badge>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white mb-1">{step.action}</p>
                        <a href={step.resourceUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />{step.resource}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Certifications */}
                {roadmap.certifications.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-4 flex items-center gap-2">
                      <Award className="h-4 w-4" /> Certifications to Pursue
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.certifications.map((c, i) => (
                        <span key={i} className="text-sm bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* DSA Topics */}
                {roadmap.dsaTopics && roadmap.dsaTopics.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-4 flex items-center gap-2">
                      <Code2 className="h-4 w-4" /> DSA Topics to Practice
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {roadmap.dsaTopics.map((t, i) => (
                        <a key={i} href={`https://leetcode.com/tag/${t.toLowerCase().replace(/\s+/g, '-')}`} target="_blank" rel="noreferrer"
                          className="text-sm bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors">
                          {t} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">Select your target goal above to generate your personalized roadmap</p>
                <Button onClick={() => fetchRoadmap(selectedGoal || result.detectedField)} className="bg-blue-600 text-white">
                  Generate My Roadmap
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: IMPROVED RESUME ── */}
        {activeTab === 'resume' && (
          <div className="max-w-4xl mx-auto space-y-5">
            {improveResult ? (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Improved Resume</h2>
                    <p className="text-sm text-slate-500">AI has applied all improvements from the analysis</p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={downloadPdf} className="bg-red-600 hover:bg-red-700 text-white">
                      <FileDown className="mr-2 h-4 w-4" />PDF
                    </Button>
                    <Button onClick={downloadDocx} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <FileType className="mr-2 h-4 w-4" />DOCX
                    </Button>
                  </div>
                </div>

                {/* Resume Preview */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs text-slate-400 font-mono">improved-resume.pdf</span>
                  </div>
                  <div className="p-8 font-mono text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                    {improveResult.improvedText}
                  </div>
                </div>
                <p className="text-xs text-center text-slate-400">PDF: Opens print dialog → Save as PDF in your browser</p>
              </>
            ) : (
              <div className="text-center py-24">
                <div className="w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">AI Resume Rewriter</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  {isPro
                    ? 'Let AI apply every improvement and generate a fully optimized resume downloadable as PDF or DOCX.'
                    : 'Upgrade to Pro to unlock AI-powered resume rewriting with PDF and DOCX download.'}
                </p>
                {isPro ? (
                  <Button onClick={improveResume} disabled={improving || userScans < 2} className="bg-purple-600 hover:bg-purple-700 text-white" size="lg">
                    {improving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rewriting...</> : <><Sparkles className="mr-2 h-4 w-4" />Improve My Resume (2 scans)</>}
                  </Button>
                ) : (
                  <Link href="/pricing">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white" size="lg">Upgrade to Pro →</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

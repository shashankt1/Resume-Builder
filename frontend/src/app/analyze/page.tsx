'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import {
  FileText, ArrowLeft, Zap, Sun, Moon, Upload, X, CheckCircle,
  AlertCircle, Target, Sparkles, ChevronRight, Share2,
  FileDown, FileType, RotateCcw, BookOpen, Award,
  Briefcase, Code2, Star, ArrowRight, Edit3, Loader2
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stripMd = (s: string) =>
  s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1').trim()

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Opportunity {
  icon: string; title: string; whatsHappening: string
  theFix: string; impact: number; proOnly: boolean
}
interface ATSResult {
  score: number; detectedField: string; experienceYears: number
  keywordMatches: string[]; missingKeywords: string[]
  strengths: string[]; improvements: string[]; opportunities: Opportunity[]
  summary: string; projectedScore: number; scorePercentile: number
  strengthStatement: string; realWorldContext: string
}
interface RoadmapStep {
  week: string; action: string; resource: string; resourceUrl: string; free: boolean
}
interface Roadmap {
  currentGoal: string; targetGoal: string; timeframe: string
  steps: RoadmapStep[]; certifications: string[]
  dsaTopics: string[] | null; salaryJump: string
}
interface ImproveResult {
  improvedText: string; docxBase64: string; pdfHtmlBase64: string
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

// ─── Score meta ────────────────────────────────────────────────────────────────
function getScoreMeta(score: number) {
  if (score >= 90) return { label: 'Elite Level', hex: '#27AE60', from: '#10b981', to: '#059669', msg: "You're in the top 5% of resumes. Here's how to make it perfect." }
  if (score >= 80) return { label: 'Interview Ready', hex: '#27AE60', from: '#22c55e', to: '#16a34a', msg: "You're ahead of most applicants. Three refinements away from the top tier." }
  if (score >= 70) return { label: 'Almost There', hex: '#F39C12', from: '#f59e0b', to: '#d97706', msg: "Strong foundation. The gap between here and the shortlist is smaller than you think." }
  if (score >= 60) return { label: 'Getting Closer', hex: '#F39C12', from: '#fb923c', to: '#ea580c', msg: "You're being seen but filtered before human eyes reach you. Fixable today." }
  if (score >= 50) return { label: 'Needs Attention', hex: '#E74C3C', from: '#f87171', to: '#dc2626', msg: "Now you know why callbacks weren't coming. This explains everything — and everything is fixable." }
  return { label: 'Fresh Start', hex: '#E74C3C', from: '#fb7185', to: '#e11d48', msg: "This is good news. You now have the clearest possible picture of exactly what to fix." }
}

// ─── Animated Score Ring ───────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0)
  const meta = getScoreMeta(score)
  const size = 200
  const radius = 82
  const circ = 2 * Math.PI * radius
  const dash = (displayed / 100) * circ

  useEffect(() => {
    let raf: number
    let cur = 0
    const tick = () => {
      cur = Math.min(cur + 1.8, score)
      setDisplayed(Math.floor(cur))
      if (cur < score) raf = requestAnimationFrame(tick)
    }
    const t = setTimeout(() => { raf = requestAnimationFrame(tick) }, 400)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [score])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={meta.from} />
            <stop offset="100%" stopColor={meta.to} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="url(#scoreGrad)" strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.04s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-black text-white leading-none">{displayed}</span>
        <span className="text-xs font-bold tracking-[0.2em] uppercase mt-2" style={{ color: meta.from }}>{meta.label}</span>
      </div>
    </div>
  )
}

// ─── Background ────────────────────────────────────────────────────────────────
function PageBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      {/* deep space base */}
      <div className="absolute inset-0 bg-[#060c1a]" />
      {/* blobs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.12]"
        style={{ background: 'radial-gradient(circle, #1E6FD9 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      {/* grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* noise grain */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </div>
  )
}

// ─── Card shell ────────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-white/5 backdrop-blur-sm shadow-xl ${className}`}>
      {children}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [stage, setStage] = useState<Stage>('upload')
  const [scanIdx, setScanIdx] = useState(0)
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

  useEffect(() => {
    if (stage !== 'scanning') return
    const iv = setInterval(() => setScanIdx(i => (i + 1) % SCAN_MESSAGES.length), 2200)
    return () => clearInterval(iv)
  }, [stage])

  const handleFile = (f: File) => {
    const ok = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!ok.includes(f.type)) { toast.error('Only PDF or DOCX files accepted'); return }
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
      const fd = new FormData()
      fd.append('file', file); fd.append('userId', userId!)
      const res = await fetch('/api/ai/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data); setSelectedGoal(data.detectedField || '')
      setUserScans(prev => prev - 1); setStage('prewarm')
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, detectedField: result.detectedField, targetGoal: goal, score: result.score }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRoadmap(data)
    } catch { toast.error('Failed to generate roadmap') }
    finally { setLoadingRoadmap(false) }
  }

  const handleGoalChange = (g: string) => {
    setSelectedGoal(g); setShowGoalEditor(false); fetchRoadmap(g)
  }

  const improveResume = async () => {
    if (!result || !file) return
    if (!isPro) { toast.error('Upgrade to Pro'); return }
    if (userScans < 2) { toast.error('Need 2 scans'); return }
    setImproving(true)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('userId', userId!)
      fd.append('improvements', JSON.stringify(result.improvements))
      const res = await fetch('/api/ai/improve', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImproveResult(data); setUserScans(prev => prev - 2)
      setActiveTab('resume'); toast.success('Resume improved!')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setImproving(false) }
  }

  const downloadDocx = () => {
    if (!improveResult?.docxBase64) return
    const b = Uint8Array.from(atob(improveResult.docxBase64), c => c.charCodeAt(0))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([b], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
    a.download = 'improved-resume.docx'; a.click()
  }

  const downloadPdf = () => {
    if (!improveResult?.pdfHtmlBase64) return
    const w = window.open('', '_blank')
    if (!w) { toast.error('Allow popups'); return }
    w.document.write(atob(improveResult.pdfHtmlBase64)); w.document.close(); w.focus()
    setTimeout(() => w.print(), 500)
  }

  const shareScore = () => {
    const m = getScoreMeta(result?.score || 0)
    const text = `I scored ${result?.score}/100 on CraftlyCV — ${m.label}! 🎯\nFind out why you're not getting callbacks → craftlycv.in`
    if (navigator.share) navigator.share({ title: 'My CraftlyCV Score', text, url: 'https://craftlycv.in' })
    else { navigator.clipboard.writeText(text); toast.success('Copied to clipboard!') }
  }

  const reset = () => { setStage('upload'); setResult(null); setFile(null); setImproveResult(null); setRoadmap(null) }
  const fmtSize = (b: number) => b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB'

  // ── SCANNING ──────────────────────────────────────────────────────────────────
  if (stage === 'scanning') return (
    <div className="fixed inset-0 bg-[#060c1a] flex flex-col items-center justify-center px-4 z-50">
      <PageBg />
      <div className="relative z-10 text-center max-w-md">
        <div className="relative w-28 h-28 mx-auto mb-10">
          {[0,1,2].map(i => (
            <div key={i} className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping"
              style={{ animationDelay: `${i * 0.4}s`, animationDuration: '1.8s' }} />
          ))}
          <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Target className="h-9 w-9 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white mb-4">Analyzing Your Resume</h2>
        <p className="text-blue-300 text-lg font-medium h-8 transition-all">{SCAN_MESSAGES[scanIdx]}</p>
        <div className="mt-10 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-400 rounded-full"
            style={{ width: '65%', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
        <p className="text-white/30 text-sm mt-3">Running 47 ATS checks...</p>
      </div>
    </div>
  )

  // ── PRE-WARM ──────────────────────────────────────────────────────────────────
  if (stage === 'prewarm') return (
    <div className="fixed inset-0 bg-[#060c1a] flex items-center justify-center px-4 z-50">
      <PageBg />
      <div className="relative z-10 max-w-lg text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-400 flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-4xl font-black text-white mb-8 leading-tight">
          We've finished<br />analyzing your resume.
        </h2>
        <div className="space-y-4 text-lg mb-12">
          <p className="text-white/60">Before we show you the results — know this:</p>
          <p className="text-white font-semibold">
            Every resume we've ever improved started exactly where yours is right now.
          </p>
          <p className="text-white/60">What you're about to see isn't a judgment.</p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">
            It's a map. 🗺️
          </p>
        </div>
        <button
          onClick={() => setStage('results')}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-500 hover:to-orange-400 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/20 transition-all hover:scale-105"
        >
          Show Me My Results <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )

  // ── UPLOAD ────────────────────────────────────────────────────────────────────
  if (stage === 'upload' || !result) return (
    <div className="min-h-screen relative">
      <PageBg />
      <div className="relative z-10">
        {/* Nav */}
        <nav className="border-b border-white/8 bg-white/3 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CraftlyCV</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">{pageLoading ? '...' : userScans} scans</span>
              </div>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70 transition-all">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link href="/dashboard">
                <button className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-all">
                  <ArrowLeft className="h-4 w-4" />Dashboard
                </button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Target className="h-4 w-4" /> The toughest ATS analyzer · 47 checks
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-[1.1] mb-5">
              Find out exactly why<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-orange-400">
                you're not getting callbacks
              </span>
            </h1>
            <p className="text-lg text-white/50 max-w-md mx-auto">
              We analyze it the same way ATS systems at Google, TCS, and 500+ companies do.
            </p>
          </div>

          {/* Upload card */}
          <GlassCard className="p-8">
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => !file && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragging ? 'border-blue-400 bg-blue-500/10'
                : file ? 'border-green-400/60 bg-green-500/8 cursor-default'
                : 'border-white/10 hover:border-blue-400/50 hover:bg-blue-500/5'
              }`}
            >
              <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {file ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-white truncate">{file.name}</p>
                    <p className="text-sm text-white/40">{fmtSize(file.size)} · Ready to analyze</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null) }}
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-white/40 transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-white/6 border border-white/8 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-white/30" />
                  </div>
                  <p className="text-lg font-semibold text-white/80 mb-1">{dragging ? 'Drop it here!' : 'Drag & drop your resume'}</p>
                  <p className="text-white/30 text-sm">PDF or DOCX · Max 5MB</p>
                  <button onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                    className="mt-4 px-5 py-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 text-sm transition-all">
                    Browse Files
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={analyzeResume}
              disabled={!file || userScans < 1 || pageLoading}
              className="w-full mt-5 py-5 rounded-2xl font-bold text-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: (!file || userScans < 1) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #1E6FD9 0%, #1a5cbf 100%)', boxShadow: (!file || userScans < 1) ? 'none' : '0 8px 32px rgba(30,111,217,0.3)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <Target className="h-5 w-5" /> Analyze My Resume — 1 Scan
              </span>
            </button>

            {userScans < 1 && !pageLoading && (
              <p className="text-center text-red-400 text-sm mt-3">
                No scans left. <Link href="/pricing" className="underline font-semibold text-orange-400">Get more scans →</Link>
              </p>
            )}

            <div className="mt-7 pt-5 border-t border-white/6 flex flex-wrap justify-center gap-5 text-xs text-white/25">
              <span>🔒 Never stored after analysis</span>
              <span>⚡ Results in ~30 seconds</span>
              <span>🎯 47-point ATS check</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )

  // ── RESULTS ───────────────────────────────────────────────────────────────────
  const meta = getScoreMeta(result.score)

  return (
    <div className="min-h-screen relative">
      <PageBg />
      <div className="relative z-10">

        {/* Nav */}
        <nav className="border-b border-white/8 bg-white/3 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CraftlyCV</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">{userScans} scans</span>
              </div>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70 transition-all">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 text-sm transition-all">
                <RotateCcw className="h-4 w-4" />New Scan
              </button>
            </div>
          </div>
        </nav>

        {/* Strength Banner */}
        <div className="border-b border-white/6 bg-blue-600/10 backdrop-blur-sm px-4 py-3 text-center">
          <p className="text-sm text-blue-200 max-w-3xl mx-auto">
            💪 <strong className="text-white">Your foundation is solid.</strong>{' '}
            {stripMd(result.strengthStatement)}
          </p>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-white/8 bg-white/3 backdrop-blur-md sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 py-1">
            {[
              { id: 'score', emoji: '📊', label: 'Score & Opportunities' },
              { id: 'roadmap', emoji: '🗺️', label: 'Career Roadmap' },
              { id: 'resume', emoji: '✨', label: 'Improved Resume' },
            ].map(t => (
              <button key={t.id}
                onClick={() => {
                  setActiveTab(t.id as any)
                  if (t.id === 'roadmap' && !roadmap && !loadingRoadmap) fetchRoadmap(selectedGoal || result.detectedField)
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* ── SCORE TAB ── */}
          {activeTab === 'score' && (
            <div className="grid lg:grid-cols-5 gap-5">

              {/* LEFT */}
              <div className="lg:col-span-2 space-y-4">

                {/* Score card */}
                <div className="rounded-2xl overflow-hidden relative"
                  style={{ background: `linear-gradient(135deg, ${meta.from}22 0%, ${meta.to}15 100%)`, border: `1px solid ${meta.from}30` }}>
                  <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="relative p-8 flex flex-col items-center">
                    <ScoreRing score={result.score} />
                    <p className="text-white/70 text-center text-sm mt-5 leading-relaxed max-w-xs">{meta.msg}</p>

                    {/* Projection bars */}
                    <div className="w-full mt-6 bg-white/5 rounded-2xl p-4 border border-white/8">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">After fixes, your score becomes</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full rounded-full bg-white/40" style={{ width: `${result.score}%`, transition: 'width 1s ease' }} />
                          </div>
                          <span className="text-white/60 font-bold text-sm w-8 text-right">{result.score}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-white/10 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${result.projectedScore}%`, background: `linear-gradient(90deg, ${meta.from}, ${meta.to})`, transition: 'width 1.5s ease 0.5s' }} />
                          </div>
                          <span className="font-bold text-sm w-8 text-right" style={{ color: meta.from }}>{result.projectedScore} ✦</span>
                        </div>
                      </div>
                      <p className="text-white/25 text-xs mt-3">Top {100 - result.scorePercentile}% of all resumes in your field</p>
                    </div>

                    <button onClick={shareScore} className="w-full mt-4 py-3 rounded-xl border border-white/15 bg-white/8 hover:bg-white/12 text-white/70 hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all">
                      <Share2 className="h-4 w-4" />Share My Score
                    </button>
                  </div>
                </div>

                {/* Real world context */}
                <GlassCard className="p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">What this means in real terms</p>
                  <p className="text-white/70 text-sm leading-relaxed">{stripMd(result.realWorldContext)}</p>
                </GlassCard>

                {/* Keywords found */}
                <GlassCard className="p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5" />Keywords Found ({result.keywordMatches.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywordMatches.map((kw, i) => (
                      <span key={i} className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        {stripMd(kw)}
                      </span>
                    ))}
                  </div>
                </GlassCard>

                {/* Keywords missing */}
                <GlassCard className="p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" />Not Yet Included ({result.missingKeywords.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2.5 py-1 rounded-full">
                        {stripMd(kw)}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-3 space-y-4">

                {/* Strengths */}
                <GlassCard className="p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-5 flex items-center gap-2">
                    <Star className="h-3.5 w-3.5" />What's Working In Your Favour
                  </p>
                  <ul className="space-y-4">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <span className="text-sm text-white/70 leading-relaxed">{stripMd(s)}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* Opportunities */}
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 px-1">Your Biggest Opportunities</p>
                {result.opportunities.map((opp, i) => (
                  <div key={i} className={`rounded-2xl p-6 border transition-all ${
                    opp.proOnly && !isPro
                      ? 'bg-purple-500/5 border-purple-500/20'
                      : 'bg-white/4 border-white/8 hover:border-blue-500/30 hover:bg-blue-500/5'
                  }`}>
                    <div className="flex items-start gap-4">
                      <span className="text-2xl shrink-0 mt-0.5">{opp.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-bold text-white">{stripMd(opp.title)}</p>
                          {opp.proOnly && !isPro && (
                            <span className="text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full">Pro</span>
                          )}
                          <span className="text-xs text-orange-400 font-bold ml-auto">+{opp.impact} pts</span>
                        </div>
                        <p className="text-sm text-white/50 mb-4 leading-relaxed">{stripMd(opp.whatsHappening)}</p>
                        {opp.proOnly && !isPro ? (
                          <div className="flex items-center justify-between gap-3 bg-purple-500/8 border border-purple-500/15 rounded-xl p-3">
                            <p className="text-xs text-purple-300">🔒 Exact fix available on Pro</p>
                            <Link href="/pricing">
                              <button className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all">Unlock</button>
                            </Link>
                          </div>
                        ) : (
                          <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4">
                            <p className="text-xs font-bold text-blue-400 mb-2">The fix:</p>
                            <p className="text-sm text-blue-100/80">{stripMd(opp.theFix)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Improve Resume CTA */}
                <div className="rounded-2xl p-6 border border-purple-500/20 bg-purple-500/5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white mb-1">AI-Powered Resume Rewrite</p>
                      <p className="text-sm text-white/40 mb-4">
                        {isPro
                          ? 'AI applies every fix above and generates a fully optimized resume · 2 scans'
                          : 'Pro feature — AI rewrites your entire resume applying all improvements, downloadable as PDF or DOCX'}
                      </p>
                      {improveResult ? (
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">
                            <FileDown className="h-4 w-4" />PDF
                          </button>
                          <button onClick={downloadDocx} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
                            <FileType className="h-4 w-4" />DOCX
                          </button>
                          <button onClick={() => setActiveTab('resume')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 text-sm font-semibold transition-all">
                            <FileText className="h-4 w-4" />Preview
                          </button>
                        </div>
                      ) : isPro ? (
                        <button onClick={improveResume} disabled={improving || userScans < 2}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-40">
                          {improving ? <><Loader2 className="h-4 w-4 animate-spin" />Rewriting...</> : <><Sparkles className="h-4 w-4" />Improve & Download (2 scans)</>}
                        </button>
                      ) : (
                        <Link href="/pricing">
                          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all">
                            Upgrade to Pro →
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ROADMAP TAB ── */}
          {activeTab === 'roadmap' && (
            <div className="max-w-4xl mx-auto space-y-5">

              {/* Goal selector */}
              <GlassCard className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">Your target goal</p>
                    <p className="text-xl font-bold text-white">{selectedGoal || result.detectedField}</p>
                    <p className="text-sm text-white/40 mt-1">Auto-detected from your resume</p>
                  </div>
                  <button onClick={() => setShowGoalEditor(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/60 text-sm transition-all shrink-0">
                    <Edit3 className="h-4 w-4" />Change Goal
                  </button>
                </div>
                {showGoalEditor && (
                  <div className="mt-5 space-y-3 border-t border-white/8 pt-5">
                    <p className="text-sm font-semibold text-white/70">Where do you want to go?</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {GOAL_OPTIONS.map(g => (
                        <button key={g} onClick={() => handleGoalChange(g)}
                          className={`text-left text-sm px-4 py-3 rounded-xl border transition-all ${
                            selectedGoal === g
                              ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                              : 'bg-white/4 border-white/8 hover:border-blue-500/30 text-white/60 hover:text-white/90'
                          }`}>{g}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Or type your own goal..."
                        value={customGoal} onChange={e => setCustomGoal(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50" />
                      <button onClick={() => customGoal.trim() && handleGoalChange(customGoal.trim())}
                        className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>

              {loadingRoadmap ? (
                <div className="text-center py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-white/40">Building your personalized roadmap...</p>
                </div>
              ) : roadmap ? (
                <>
                  {/* Header */}
                  <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Your career roadmap</p>
                        <p className="text-2xl font-black leading-tight">
                          {roadmap.currentGoal}
                          <span className="mx-3 text-blue-400">→</span>
                          <span className="text-blue-200">{roadmap.targetGoal}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Timeline</p>
                        <p className="text-2xl font-black">{roadmap.timeframe}</p>
                        {roadmap.salaryJump && <p className="text-yellow-300 text-sm mt-1 font-semibold">💰 {roadmap.salaryJump}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    {roadmap.steps.map((step, i) => (
                      <GlassCard key={i} className="p-5 flex gap-4">
                        <div className="shrink-0 flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white"
                            style={{ background: 'linear-gradient(135deg, #1E6FD9, #1a5cbf)' }}>{i + 1}</div>
                          {i < roadmap.steps.length - 1 && <div className="w-px flex-1 bg-white/8 mt-2 min-h-[20px]" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">{step.week}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${step.free ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/6 text-white/40 border border-white/10'}`}>
                              {step.free ? '✓ Free' : 'Paid'}
                            </span>
                          </div>
                          <p className="font-semibold text-white mb-2 leading-snug">{stripMd(step.action)}</p>
                          <a href={step.resourceUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            <BookOpen className="h-3.5 w-3.5" />{stripMd(step.resource)} ↗
                          </a>
                        </div>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Certifications */}
                  {roadmap.certifications.length > 0 && (
                    <GlassCard className="p-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                        <Award className="h-4 w-4" />Certifications to Pursue
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {roadmap.certifications.map((c, i) => (
                          <span key={i} className="text-sm bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-full font-medium">{stripMd(c)}</span>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {/* DSA */}
                  {roadmap.dsaTopics && roadmap.dsaTopics.length > 0 && (
                    <GlassCard className="p-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                        <Code2 className="h-4 w-4" />DSA Topics to Practice
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {roadmap.dsaTopics.map((t, i) => (
                          <a key={i} href={`https://leetcode.com/tag/${t.toLowerCase().replace(/\s+/g, '-')}`} target="_blank" rel="noreferrer"
                            className="text-sm bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-full hover:bg-emerald-500/20 transition-colors">
                            {stripMd(t)} ↗
                          </a>
                        ))}
                      </div>
                    </GlassCard>
                  )}
                </>
              ) : (
                <div className="text-center py-24">
                  <Briefcase className="h-12 w-12 text-white/15 mx-auto mb-4" />
                  <p className="text-white/40 mb-5">Select your target goal above to generate your personalized roadmap</p>
                  <button onClick={() => fetchRoadmap(selectedGoal || result.detectedField)}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all">
                    Generate My Roadmap
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── RESUME TAB ── */}
          {activeTab === 'resume' && (
            <div className="max-w-4xl mx-auto space-y-5">
              {improveResult ? (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">Your Improved Resume</h2>
                      <p className="text-sm text-white/40 mt-1">All improvements applied by AI</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">
                        <FileDown className="h-4 w-4" />Download PDF
                      </button>
                      <button onClick={downloadDocx} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all">
                        <FileType className="h-4 w-4" />Download DOCX
                      </button>
                    </div>
                  </div>
                  <GlassCard className="overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8 bg-white/4">
                      {['#ff5f57','#febc2e','#28c840'].map((c, i) => <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
                      <span className="ml-2 text-xs text-white/25 font-mono">improved-resume.txt</span>
                    </div>
                    <div className="p-8 font-mono text-sm text-white/70 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                      {improveResult.improvedText}
                    </div>
                  </GlassCard>
                  <p className="text-xs text-center text-white/25">PDF: Opens print dialog → Save as PDF in your browser</p>
                </>
              ) : (
                <div className="text-center py-28">
                  <div className="w-20 h-20 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">AI Resume Rewriter</h3>
                  <p className="text-white/40 mb-6 max-w-sm mx-auto">
                    {isPro ? 'AI applies every improvement and generates a fully optimized resume downloadable as PDF or DOCX.'
                      : 'Upgrade to Pro to unlock AI-powered resume rewriting.'}
                  </p>
                  {isPro ? (
                    <button onClick={improveResume} disabled={improving || userScans < 2}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-40">
                      {improving ? <><Loader2 className="h-4 w-4 animate-spin" />Rewriting...</> : <><Sparkles className="h-4 w-4" />Improve My Resume (2 scans)</>}
                    </button>
                  ) : (
                    <Link href="/pricing">
                      <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all">
                        Upgrade to Pro →
                      </button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  FileText, Zap, Target, Sparkles, MessageSquare, ArrowRight,
  CheckCircle, TrendingUp, Award, ChevronDown, Menu, X,
  Briefcase, GraduationCap, XCircle, Star, Users, Clock
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function useInView(ref: React.RefObject<Element>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold: 0.2 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return inView
}

function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)
  useEffect(() => {
    if (!inView) return
    let cur = 0
    const step = to / 60
    const iv = setInterval(() => {
      cur = Math.min(cur + step, to)
      setVal(Math.floor(cur))
      if (cur >= to) clearInterval(iv)
    }, 24)
    return () => clearInterval(iv)
  }, [inView, to])
  return <div ref={ref}>{prefix}{val.toLocaleString()}{suffix}</div>
}

// ── Career Story Animation ────────────────────────────────────────────────────
const STORY_FRAMES = [
  { icon: '🎓', label: 'Fresher', sub: '200+ applications sent', color: '#60a5fa', status: 'struggle' },
  { icon: '📄', label: 'ATS Score: 34', sub: 'Filtered before human eyes', color: '#f87171', status: 'fail' },
  { icon: '😔', label: '0 callbacks', sub: 'Something is clearly wrong', color: '#f87171', status: 'fail' },
  { icon: '🔍', label: 'Found CraftlyCV', sub: 'Analyzed resume in 30 sec', color: '#fb923c', status: 'turning' },
  { icon: '⚡', label: 'Score jumped to 87', sub: 'Applied all AI suggestions', color: '#34d399', status: 'win' },
  { icon: '📞', label: '6 interview calls', sub: 'In the first two weeks', color: '#34d399', status: 'win' },
  { icon: '🏆', label: 'Got the job!', sub: '₹18L offer at a startup', color: '#fbbf24', status: 'win' },
]

function CareerStoryAnimation() {
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const iv = setInterval(() => {
      setFrame(f => {
        if (f >= STORY_FRAMES.length - 1) { setPlaying(false); return f }
        return f + 1
      })
    }, 1800)
    return () => clearInterval(iv)
  }, [playing])

  const restart = () => { setFrame(0); setPlaying(true) }
  const current = STORY_FRAMES[frame]

  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      {/* Main card */}
      <div className="rounded-3xl p-8 text-center relative overflow-hidden transition-all duration-700"
        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${current.color}30`, backdropFilter: 'blur(20px)' }}>
        {/* Glow */}
        <div className="absolute inset-0 opacity-10 transition-all duration-700"
          style={{ background: `radial-gradient(circle at 50% 50%, ${current.color}, transparent 70%)` }} />

        <div className="relative z-10">
          <div className="text-6xl mb-4 transition-all duration-500" style={{ filter: `drop-shadow(0 0 20px ${current.color}60)` }}>
            {current.icon}
          </div>
          <p className="text-2xl font-black text-white mb-2 transition-all">{current.label}</p>
          <p className="text-sm font-medium" style={{ color: `${current.color}cc` }}>{current.sub}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            {STORY_FRAMES.map((f, i) => (
              <button key={i} onClick={() => { setFrame(i); setPlaying(false) }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === frame ? '20px' : '8px', height: '8px',
                  background: i <= frame ? current.color : 'rgba(255,255,255,0.15)'
                }} />
            ))}
          </div>

          {!playing && frame === STORY_FRAMES.length - 1 && (
            <button onClick={restart}
              className="mt-5 text-xs font-semibold px-4 py-2 rounded-full transition-all hover:scale-105"
              style={{ background: `${current.color}20`, color: current.color, border: `1px solid ${current.color}40` }}>
              ↺ Watch again
            </button>
          )}
        </div>
      </div>

      {/* Side indicators */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 space-y-2">
        {['struggle', 'fail', 'fail', 'turning', 'win', 'win', 'win'].slice(0, frame + 1).map((s, i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-all"
            style={{ background: s === 'win' ? '#34d399' : s === 'turning' ? '#fb923c' : '#f87171' }} />
        ))}
      </div>
    </div>
  )
}

// ── Live Activity Ticker ──────────────────────────────────────────────────────
const ACTIVITIES = [
  'Rahul from Bangalore scored 91 on ATS ⚡',
  'Priya landed a job at Flipkart 🎉',
  'Arjun improved his score from 52 → 84 📈',
  'Sneha got 4 interview calls this week 📞',
  'Vikram tailored his resume in 30 seconds ⚡',
  'Anjali switched to Data Science role 🚀',
  'Rohan from Delhi got into Amazon 🏆',
  'Meera improved LinkedIn views by 3x 📊',
]

function LiveTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % ACTIVITIES.length); setVisible(true) }, 400)
    }, 3000)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-full">
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
      <p className="text-sm text-emerald-300 font-medium transition-all duration-400"
        style={{ opacity: visible ? 1 : 0 }}>
        {ACTIVITIES[idx]}
      </p>
    </div>
  )
}

// ── Background ────────────────────────────────────────────────────────────────
function PageBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#060c1a]" />
      <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, #1E6FD9 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  )
}

// ── Score Preview Card ────────────────────────────────────────────────────────
function ScorePreviewCard() {
  const [score] = useState(58)
  const [shown, setShown] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref as React.RefObject<Element>)

  useEffect(() => {
    if (!inView) return
    let c = 0
    const iv = setInterval(() => {
      c = Math.min(c + 1, score)
      setShown(c)
      if (c >= score) clearInterval(iv)
    }, 28)
    return () => clearInterval(iv)
  }, [inView])

  const radius = 54, circ = 2 * Math.PI * radius
  const dash = (shown / 100) * circ

  return (
    <div ref={ref} className="rounded-2xl p-5 text-white w-72"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
      <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Live ATS Score Preview</p>
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 shrink-0">
          <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="56" cy="56" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle cx="56" cy="56" r={radius} fill="none" stroke="#f87171" strokeWidth="10"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.05s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{shown}</span>
            <span className="text-[10px] text-red-400 font-bold">NEEDS FIX</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          {['Missing keywords', 'No metrics', 'Weak bullets', 'Format issues'].map((issue, i) => (
            <div key={i} className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-white/60 truncate">{issue}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">After CraftlyCV fixes</span>
          <span className="text-sm font-black text-emerald-400">→ 84</span>
        </div>
        <div className="w-full bg-white/8 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: '84%' }} />
        </div>
      </div>
    </div>
  )
}

// ── Feature Cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Target, color: '#60a5fa', bg: '#1e40af', label: 'ATS Analyzer', desc: '47-point check against real ATS systems. Get your score in 30 seconds.', badge: null, scans: '1 scan' },
  { icon: FileText, color: '#a78bfa', bg: '#4c1d95', label: 'Resume Builder', desc: 'No resume? Build one from scratch with AI. Free to create, download as PDF/DOCX.', badge: 'NEW', scans: 'Free' },
  { icon: Sparkles, color: '#c084fc', bg: '#581c87', label: 'Tailor to Job', desc: 'Paste a JD and AI rewrites your resume to match in 30 seconds.', badge: 'Pro', scans: '3 scans' },
  { icon: MessageSquare, color: '#34d399', bg: '#064e3b', label: 'Interview Prep', desc: 'AI generates role-specific questions with model answers.', badge: 'Pro', scans: '5 scans' },
  { icon: TrendingUp, color: '#fb923c', bg: '#7c2d12', label: 'LinkedIn Optimizer', desc: 'Rewrite your headline, summary, and bullets for 3x more recruiter views.', badge: 'Pro', scans: '2 scans' },
  { icon: Award, color: '#fbbf24', bg: '#78350f', label: 'Career Roadmap', desc: 'Get a personalized week-by-week plan to reach your target role.', badge: null, scans: 'Free with analysis' },
]

// ── Pricing tiers ─────────────────────────────────────────────────────────────
const TIERS = [
  { name: 'Free', price: '₹0', scans: '10 scans', features: ['ATS Analyzer', 'Resume Builder', 'Career Roadmap', 'Score Share Card'], cta: 'Get Started Free', href: '/auth', highlight: false },
  { name: 'Pro', price: '₹999', period: '/mo', scans: '200 scans', features: ['Everything in Free', 'Tailor to Job', 'Interview Prep', 'LinkedIn Optimizer', 'AI Resume Rewrite', 'PDF + DOCX Download'], cta: 'Start Pro', href: '/pricing', highlight: true },
  { name: 'Founding Member', price: '₹299', period: ' one-time', scans: 'Lifetime Pro', features: ['Everything in Pro', 'Forever', 'Lock in before price rises', 'Priority support'], cta: 'Claim Offer', href: '/pricing', highlight: false, badge: '🔥 Limited — 500 spots' },
]

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen relative text-white">
      <PageBg />
      <div className="relative z-10">

        {/* NAV */}
        <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#060c1a]/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="CraftlyCV" width={36} height={36} className="rounded-xl" />
              <span className="text-xl font-black text-white">CraftlyCV</span>
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <Link href="/pricing" className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Pricing</Link>
              <Link href="/build" className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Build Resume</Link>
              <Link href="/auth" className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">Sign In</Link>
              <Link href="/auth" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105">
                Get Started Free →
              </Link>
            </div>
            <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden border-t border-white/6 bg-[#060c1a]/95 px-4 py-4 space-y-2">
              {[['Pricing', '/pricing'], ['Build Resume', '/build'], ['Sign In', '/auth']].map(([l, h]) => (
                <Link key={h} href={h} onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 text-sm font-medium">{l}</Link>
              ))}
              <Link href="/auth" onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold text-center">Get Started Free</Link>
            </div>
          )}
        </nav>

        {/* HERO */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Left — Copy */}
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                  <Zap className="h-4 w-4" /> India's toughest ATS resume analyzer
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6">
                  Your resume is getting
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400"> rejected before</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300"> anyone reads it.</span>
                </h1>
                <p className="text-lg text-white/50 mb-8 leading-relaxed max-w-lg">
                  ATS systems filter out 75% of resumes before a human sees them. Find out where yours stands — and get the exact fixes — in 30 seconds.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/auth"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg transition-all shadow-2xl shadow-blue-500/20 hover:scale-105">
                    <Target className="h-5 w-5" /> Analyze My Resume Free
                  </Link>
                  <Link href="/build"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/6 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all">
                    <FileText className="h-5 w-5" /> Build a Resume
                  </Link>
                </div>

                <p className="text-sm text-white/30 mb-6">✓ 10 free scans · No credit card · Results in 30 seconds</p>

                <LiveTicker />
              </div>

              {/* Right — Animation */}
              <div className="flex flex-col items-center gap-8">
                <CareerStoryAnimation />
                <ScorePreviewCard />
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-14 px-4 border-y border-white/6 bg-white/2">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { to: 50000, suffix: '+', label: 'Resumes Analyzed' },
              { to: 94, suffix: '%', label: 'Score Improvement' },
              { to: 2, suffix: '.5x', label: 'More Interviews' },
              { to: 30, suffix: ' sec', label: 'Analysis Time' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 mb-1">
                  <Counter to={s.to} suffix={s.suffix} />
                </div>
                <div className="text-white/40 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-3">Everything you need</p>
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                Not just a score.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">A complete career toolkit.</span>
              </h2>
              <p className="text-white/40 max-w-lg mx-auto">
                From building your first resume to landing interviews at top companies — we cover the entire journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="group rounded-2xl p-6 border border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `radial-gradient(circle at 0% 0%, ${f.color}10, transparent 60%)` }} />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                        <Icon className="h-6 w-6" style={{ color: f.color }} />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-white">{f.label}</p>
                        {f.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={f.badge === 'Pro'
                              ? { background: '#7c3aed20', color: '#a78bfa', border: '1px solid #7c3aed30' }
                              : { background: '#059669' + '20', color: '#34d399', border: '1px solid #05966930' }}>
                            {f.badge}
                          </span>
                        )}
                        <span className="text-xs text-white/30 ml-auto">{f.scans}</span>
                      </div>
                      <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-4 border-y border-white/6 bg-white/2">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black mb-4">From upload to offer letter</h2>
              <p className="text-white/40">Three steps. Thirty seconds. Real results.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-blue-600/50 via-blue-400/50 to-blue-600/50" />
              {[
                { n: '01', icon: '📤', title: 'Upload your resume', desc: 'PDF or DOCX, any format. Or build one from scratch using our AI builder — free.' },
                { n: '02', icon: '🤖', title: 'AI runs 47 checks', desc: 'Keywords, structure, ATS compatibility, impact language, quantification — everything.' },
                { n: '03', icon: '🎯', title: 'Get exact fixes', desc: 'Not vague advice. Specific rewrites, missing keywords, and a career roadmap to your goal.' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-7 text-center relative"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-5xl mb-4">{s.icon}</div>
                  <p className="text-xs font-black text-blue-400 tracking-widest mb-2">{s.n}</p>
                  <p className="font-bold text-white text-lg mb-2">{s.title}</p>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-black mb-3">Simple pricing</h2>
              <p className="text-white/40">Start free. Upgrade when you're ready.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {TIERS.map((t, i) => (
                <div key={i} className={`rounded-2xl p-7 relative overflow-hidden transition-all hover:scale-[1.02] ${
                  t.highlight ? 'border-blue-500/40 bg-blue-600/10' : 'border-white/8 bg-white/3'
                } border`}>
                  {t.highlight && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                  )}
                  {t.badge && (
                    <div className="inline-flex items-center gap-1 text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full mb-4">{t.badge}</div>
                  )}
                  <p className="text-white/60 text-sm font-semibold mb-1">{t.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-white">{t.price}</span>
                    {t.period && <span className="text-white/40 text-sm">{t.period}</span>}
                  </div>
                  <p className="text-blue-400 text-sm font-bold mb-6">{t.scans}</p>
                  <ul className="space-y-3 mb-8">
                    {t.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-white/70">
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href={t.href}
                    className={`block text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                      t.highlight
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/8 hover:bg-white/12 border border-white/10 text-white'
                    }`}>
                    {t.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 px-4 border-t border-white/6 bg-white/2">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-white/30 text-sm font-bold uppercase tracking-widest mb-10">What users are saying</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'Arjun S.', role: 'Software Engineer', text: 'Went from 34 to 89 score in one afternoon. Got 3 interview calls the next week.', stars: 5 },
                { name: 'Priya M.', role: 'Data Analyst', text: 'The roadmap feature is insane. It told me exactly what certs to get for the Data Science switch.', stars: 5 },
                { name: 'Rahul K.', role: 'MBA Graduate', text: 'As a fresher with no experience, the resume builder helped me create something actually impressive.', stars: 5 },
              ].map((t, i) => (
                <div key={i} className="rounded-2xl p-6 border border-white/6 bg-white/3">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-28 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-5xl font-black mb-5 leading-tight">
              Your next interview call<br />is one scan away.
            </h2>
            <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
              Stop wondering. Start knowing. Find out exactly what's holding your resume back.
            </p>
            <Link href="/auth"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-xl transition-all shadow-2xl shadow-blue-500/25 hover:scale-105">
              <Zap className="h-6 w-6" /> Analyze My Resume — Free
            </Link>
            <p className="text-white/25 text-sm mt-5">10 free scans · No credit card · 30 seconds</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/6 py-12 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="CraftlyCV" width={36} height={36} className="rounded-xl" />
              <span className="text-xl font-black text-white">CraftlyCV</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/build" className="hover:text-white transition-colors">Resume Builder</Link>
              <Link href="/auth" className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <p className="text-white/20 text-sm">© {new Date().getFullYear()} CraftlyCV · Built for India's job seekers</p>
          </div>
        </footer>

      </div>
    </div>
  )
}

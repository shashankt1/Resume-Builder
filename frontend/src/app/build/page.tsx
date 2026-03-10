'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  FileText, Zap, Sun, Moon, Plus, Trash2, Sparkles, ChevronDown,
  ChevronUp, ArrowRight, ArrowLeft, Download, Loader2, Lock,
  CheckCircle, User, Briefcase, GraduationCap, Code2, Award, Eye
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface WorkExp {
  id: string; company: string; role: string
  start: string; end: string; bullets: string[]
}
interface Education {
  id: string; institution: string; degree: string; year: string; gpa: string
}
interface ResumeData {
  name: string; email: string; phone: string; location: string
  linkedin: string; github: string; summary: string
  skills: string[]; workExp: WorkExp[]; education: Education[]
  certifications: string[]; projects: string[]
}

const blank = (): ResumeData => ({
  name: '', email: '', phone: '', location: '', linkedin: '', github: '',
  summary: '', skills: [], workExp: [], education: [],
  certifications: [], projects: [],
})

const uid = () => Math.random().toString(36).slice(2)

type Step = 'basics' | 'experience' | 'education' | 'skills' | 'preview'
const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'basics', label: 'Basic Info', icon: User },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code2 },
  { id: 'preview', label: 'Preview', icon: Eye },
]

// ── Background ─────────────────────────────────────────────────────────────────
function PageBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#060c1a]" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, #1E6FD9 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  )
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, placeholder = '', type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/8 transition-all" />
    </div>
  )
}

function Textarea({ label, value, onChange, rows = 3, placeholder = '' }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 resize-none transition-all" />
    </div>
  )
}

// ── Resume HTML Generator ──────────────────────────────────────────────────────
function buildResumeHtml(data: ResumeData, watermark: boolean): string {
  const wm = watermark
    ? `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:60px;font-weight:900;color:rgba(30,111,217,0.08);pointer-events:none;white-space:nowrap;z-index:9999;letter-spacing:8px;font-family:sans-serif;">CRAFTLYCV.IN</div>`
    : ''
  const footer = watermark
    ? `<div style="margin-top:32px;padding-top:16px;border-top:2px solid #1E6FD9;text-align:center;font-size:11px;color:#1E6FD9;font-weight:700;letter-spacing:2px;font-family:sans-serif;">Created with CraftlyCV.in · Upgrade to download without watermark</div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Georgia', serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; background: white; padding: 32px 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24pt; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
  .contact { font-size: 9.5pt; color: #475569; margin-top: 4px; }
  .contact a { color: #1E6FD9; text-decoration: none; }
  .section { margin-top: 20px; }
  .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1E6FD9; border-bottom: 1.5px solid #1E6FD9; padding-bottom: 3px; margin-bottom: 10px; }
  .job { margin-bottom: 14px; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; }
  .job-title { font-weight: 700; font-size: 11pt; }
  .job-company { font-style: italic; color: #475569; font-size: 10pt; }
  .job-date { font-size: 9.5pt; color: #64748b; }
  ul { margin-top: 5px; padding-left: 16px; }
  li { margin-bottom: 3px; font-size: 10.5pt; color: #334155; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 10px; font-size: 9.5pt; color: #1e40af; font-weight: 600; }
  .edu { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
  .cert { font-size: 10.5pt; color: #334155; margin-bottom: 4px; }
  .cert::before { content: "• "; color: #1E6FD9; font-weight: 700; }
  @media print { body { padding: 20px 28px; } }
</style></head><body>
${wm}
<h1>${data.name || 'Your Name'}</h1>
<div class="contact">
  ${[data.email, data.phone, data.location].filter(Boolean).join(' · ')}
  ${data.linkedin ? ` · <a href="${data.linkedin}">LinkedIn</a>` : ''}
  ${data.github ? ` · <a href="${data.github}">GitHub</a>` : ''}
</div>

${data.summary ? `<div class="section"><div class="section-title">Professional Summary</div><p style="font-size:10.5pt;color:#334155;line-height:1.6">${data.summary}</p></div>` : ''}

${data.workExp.length ? `<div class="section"><div class="section-title">Experience</div>
${data.workExp.map(w => `<div class="job">
  <div class="job-header"><div><span class="job-title">${w.role}</span> <span class="job-company">@ ${w.company}</span></div><span class="job-date">${w.start} – ${w.end}</span></div>
  ${w.bullets.filter(Boolean).length ? `<ul>${w.bullets.filter(Boolean).map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
</div>`).join('')}
</div>` : ''}

${data.education.length ? `<div class="section"><div class="section-title">Education</div>
${data.education.map(e => `<div class="edu"><div><strong>${e.degree}</strong><br><span style="color:#475569;font-size:10pt">${e.institution}</span></div><span style="font-size:9.5pt;color:#64748b">${e.year}${e.gpa ? ` · GPA: ${e.gpa}` : ''}</span></div>`).join('')}
</div>` : ''}

${data.skills.length ? `<div class="section"><div class="section-title">Skills</div><div class="skills-grid">${data.skills.filter(Boolean).map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></div>` : ''}

${data.certifications.filter(Boolean).length ? `<div class="section"><div class="section-title">Certifications</div>${data.certifications.filter(Boolean).map(c => `<div class="cert">${c}</div>`).join('')}</div>` : ''}

${data.projects.filter(Boolean).length ? `<div class="section"><div class="section-title">Projects</div>${data.projects.filter(Boolean).map(p => `<div class="cert">${p}</div>`).join('')}</div>` : ''}

${footer}
</body></html>`
}

// ── AI Enhance ────────────────────────────────────────────────────────────────
async function aiEnhanceSummary(data: ResumeData): Promise<string> {
  const res = await fetch('/api/ai/build-resume', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: 'summary', data }),
  })
  const j = await res.json()
  return j.result || data.summary
}

async function aiEnhanceBullets(company: string, role: string, raw: string[]): Promise<string[]> {
  const res = await fetch('/api/ai/build-resume', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: 'bullets', company, role, bullets: raw }),
  })
  const j = await res.json()
  return j.result || raw
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BuildResumePage() {
  const [data, setData] = useState<ResumeData>(blank())
  const [step, setStep] = useState<Step>('basics')
  const [userId, setUserId] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState('free')
  const [userScans, setUserScans] = useState(0)
  const [pageLoading, setPageLoading] = useState(true)
  const [enhancing, setEnhancing] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [certInput, setCertInput] = useState('')
  const [projectInput, setProjectInput] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const isPro = userPlan === 'pro' || userPlan === 'enterprise'

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth?redirect=/build'); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('scans, plan').eq('id', user.id).single()
      if (profile) { setUserScans(profile.scans ?? 10); setUserPlan(profile.plan ?? 'free') }
      setPageLoading(false)
    }
    check()
  }, [])

  const set = (key: keyof ResumeData, val: any) => setData(d => ({ ...d, [key]: val }))

  // Work experience helpers
  const addWork = () => set('workExp', [...data.workExp, { id: uid(), company: '', role: '', start: '', end: 'Present', bullets: ['', '', ''] }])
  const updateWork = (id: string, key: keyof WorkExp, val: any) =>
    set('workExp', data.workExp.map(w => w.id === id ? { ...w, [key]: val } : w))
  const updateBullet = (id: string, bi: number, val: string) =>
    set('workExp', data.workExp.map(w => w.id === id ? { ...w, bullets: w.bullets.map((b, i) => i === bi ? val : b) } : w))
  const removeWork = (id: string) => set('workExp', data.workExp.filter(w => w.id !== id))

  // Education helpers
  const addEdu = () => set('education', [...data.education, { id: uid(), institution: '', degree: '', year: '', gpa: '' }])
  const updateEdu = (id: string, key: keyof Education, val: string) =>
    set('education', data.education.map(e => e.id === id ? { ...e, [key]: val } : e))
  const removeEdu = (id: string) => set('education', data.education.filter(e => e.id !== id))

  // Skills
  const addSkill = () => {
    if (!skillInput.trim()) return
    set('skills', [...data.skills, skillInput.trim()]); setSkillInput('')
  }

  // AI enhance summary
  const enhanceSummary = async () => {
    setEnhancing('summary')
    try {
      const r = await aiEnhanceSummary(data)
      set('summary', r); toast.success('Summary enhanced by AI!')
    } catch { toast.error('AI enhancement failed') }
    finally { setEnhancing(null) }
  }

  // AI enhance bullets
  const enhanceBullets = async (workId: string) => {
    const w = data.workExp.find(x => x.id === workId)
    if (!w) return
    setEnhancing(workId)
    try {
      const r = await aiEnhanceBullets(w.company, w.role, w.bullets)
      updateWork(workId, 'bullets', r); toast.success('Bullets enhanced by AI!')
    } catch { toast.error('AI enhancement failed') }
    finally { setEnhancing(null) }
  }

  // Preview + Download
  const openPreview = (clean: boolean) => {
    const html = buildResumeHtml(data, !clean)
    const w = window.open('', '_blank')
    if (!w) { toast.error('Allow popups'); return }
    w.document.write(html); w.document.close()
    if (clean) { w.focus(); setTimeout(() => w.print(), 600) }
  }

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const goNext = () => stepIdx < STEPS.length - 1 && setStep(STEPS[stepIdx + 1].id)
  const goPrev = () => stepIdx > 0 && setStep(STEPS[stepIdx - 1].id)

  if (pageLoading) return (
    <div className="min-h-screen bg-[#060c1a] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen relative">
      <PageBg />
      <div className="relative z-10">

        {/* Nav */}
        <nav className="border-b border-white/8 bg-[#060c1a]/80 backdrop-blur-md sticky top-0 z-50">
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
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/70 transition-all">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link href="/dashboard">
                <button className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-all">
                  <ArrowLeft className="h-4 w-4" />Dashboard
                </button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2">Resume Builder</h1>
            <p className="text-white/40">Free to build · CraftlyCV watermark · Upgrade to download clean PDF/DOCX</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-5 left-0 right-0 h-px bg-white/8 z-0" />
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const active = s.id === step
              const done = i < stepIdx
              return (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className="flex flex-col items-center gap-2 relative z-10 transition-all">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    active ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/30'
                    : done ? 'bg-emerald-600/20 border-emerald-500/40'
                    : 'bg-white/6 border-white/12'
                  }`}>
                    {done ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-white/30'}`} />}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${active ? 'text-blue-400' : done ? 'text-emerald-400' : 'text-white/30'}`}>{s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Step Content */}
          <GlassCard className="p-8 mb-6">

            {/* BASICS */}
            {step === 'basics' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><User className="h-5 w-5 text-blue-400" />Basic Information</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Input label="Full Name *" value={data.name} onChange={v => set('name', v)} placeholder="Rahul Sharma" />
                  <Input label="Email *" value={data.email} onChange={v => set('email', v)} placeholder="rahul@email.com" type="email" />
                  <Input label="Phone" value={data.phone} onChange={v => set('phone', v)} placeholder="+91 98765 43210" />
                  <Input label="Location" value={data.location} onChange={v => set('location', v)} placeholder="Bangalore, India" />
                  <Input label="LinkedIn URL" value={data.linkedin} onChange={v => set('linkedin', v)} placeholder="linkedin.com/in/rahulsharma" />
                  <Input label="GitHub URL" value={data.github} onChange={v => set('github', v)} placeholder="github.com/rahulsharma" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">Professional Summary</label>
                    <button onClick={enhanceSummary} disabled={!!enhancing}
                      className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-all">
                      {enhancing === 'summary' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      AI Enhance
                    </button>
                  </div>
                  <textarea value={data.summary} onChange={e => set('summary', e.target.value)} rows={4}
                    placeholder="Results-driven software engineer with 3+ years of experience building scalable web applications..."
                    className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 resize-none transition-all" />
                </div>
              </div>
            )}

            {/* EXPERIENCE */}
            {step === 'experience' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-400" />Work Experience</h2>
                  <button onClick={addWork}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 text-sm font-semibold hover:bg-blue-600/25 transition-all">
                    <Plus className="h-4 w-4" />Add Job
                  </button>
                </div>
                {data.workExp.length === 0 && (
                  <div className="text-center py-16 text-white/25">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No experience added yet.</p>
                    <p className="text-sm mt-1">Fresher? That's fine — add internships, projects, or skip this step.</p>
                    <button onClick={addWork} className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 text-sm font-semibold hover:bg-blue-600/25 transition-all">
                      + Add Experience
                    </button>
                  </div>
                )}
                <div className="space-y-6">
                  {data.workExp.map((w, wi) => (
                    <div key={w.id} className="rounded-2xl p-6 border border-white/8 bg-white/3 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-white/60">Job {wi + 1}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => enhanceBullets(w.id)} disabled={!!enhancing}
                            className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-40 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-all">
                            {enhancing === w.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            AI Enhance Bullets
                          </button>
                          <button onClick={() => removeWork(w.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input label="Company *" value={w.company} onChange={v => updateWork(w.id, 'company', v)} placeholder="Google India" />
                        <Input label="Role / Title *" value={w.role} onChange={v => updateWork(w.id, 'role', v)} placeholder="Software Engineer" />
                        <Input label="Start Date" value={w.start} onChange={v => updateWork(w.id, 'start', v)} placeholder="Jun 2022" />
                        <Input label="End Date" value={w.end} onChange={v => updateWork(w.id, 'end', v)} placeholder="Present" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/40">Key Achievements (use numbers!)</label>
                        {w.bullets.map((b, bi) => (
                          <input key={bi} type="text" value={b}
                            onChange={e => updateBullet(w.id, bi, e.target.value)}
                            placeholder={bi === 0 ? 'Increased API response time by 40% by implementing Redis caching' : bi === 1 ? 'Built and deployed a feature used by 50K+ users' : 'Led a team of 4 engineers to deliver project 2 weeks early'}
                            className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/15 text-sm focus:outline-none focus:border-blue-400/50 transition-all" />
                        ))}
                        <button onClick={() => updateWork(w.id, 'bullets', [...w.bullets, ''])}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-all">+ Add bullet</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EDUCATION */}
            {step === 'education' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-400" />Education</h2>
                  <button onClick={addEdu}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 text-sm font-semibold hover:bg-blue-600/25 transition-all">
                    <Plus className="h-4 w-4" />Add Education
                  </button>
                </div>
                {data.education.length === 0 && (
                  <div className="text-center py-16 text-white/25">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No education added yet.</p>
                    <button onClick={addEdu} className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 text-sm font-semibold hover:bg-blue-600/25 transition-all">
                      + Add Education
                    </button>
                  </div>
                )}
                <div className="space-y-5">
                  {data.education.map((e, ei) => (
                    <div key={e.id} className="rounded-2xl p-6 border border-white/8 bg-white/3 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-white/60">Degree {ei + 1}</p>
                        <button onClick={() => removeEdu(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input label="Institution *" value={e.institution} onChange={v => updateEdu(e.id, 'institution', v)} placeholder="IIT Bombay" />
                        <Input label="Degree / Program *" value={e.degree} onChange={v => updateEdu(e.id, 'degree', v)} placeholder="B.Tech Computer Science" />
                        <Input label="Year" value={e.year} onChange={v => updateEdu(e.id, 'year', v)} placeholder="2019 – 2023" />
                        <Input label="GPA / %  (optional)" value={e.gpa} onChange={v => updateEdu(e.id, 'gpa', v)} placeholder="8.4 / 10" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKILLS */}
            {step === 'skills' && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Code2 className="h-5 w-5 text-blue-400" />Skills, Certs & Projects</h2>

                {/* Skills */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Technical Skills</label>
                  <div className="flex gap-2">
                    <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSkill()}
                      placeholder="React, Python, SQL, Docker... (press Enter)"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 transition-all" />
                    <button onClick={addSkill} className="px-4 py-3 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 font-semibold hover:bg-blue-600/25 transition-all">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((s, i) => (
                      <button key={i} onClick={() => set('skills', data.skills.filter((_, j) => j !== i))}
                        className="flex items-center gap-1.5 text-sm bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/20 transition-all">
                        {s} <span className="text-xs">×</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Certifications</label>
                  <div className="flex gap-2">
                    <input type="text" value={certInput} onChange={e => setCertInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && certInput.trim()) { set('certifications', [...data.certifications, certInput.trim()]); setCertInput('') }}}
                      placeholder="AWS Solutions Architect, Google Data Analytics... (Enter)"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 transition-all" />
                    <button onClick={() => { if (certInput.trim()) { set('certifications', [...data.certifications, certInput.trim()]); setCertInput('') }}}
                      className="px-4 py-3 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 font-semibold hover:bg-blue-600/25 transition-all">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.certifications.filter(Boolean).map((c, i) => (
                      <button key={i} onClick={() => set('certifications', data.certifications.filter((_, j) => j !== i))}
                        className="flex items-center gap-1.5 text-sm bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-full hover:bg-red-500/15 hover:text-red-400 transition-all">
                        {c} <span className="text-xs">×</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Projects (one line each)</label>
                  <div className="flex gap-2">
                    <input type="text" value={projectInput} onChange={e => setProjectInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && projectInput.trim()) { set('projects', [...data.projects, projectInput.trim()]); setProjectInput('') }}}
                      placeholder="E-commerce site with 10K users · Next.js, Supabase, Stripe (Enter)"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-400/50 transition-all" />
                    <button onClick={() => { if (projectInput.trim()) { set('projects', [...data.projects, projectInput.trim()]); setProjectInput('') }}}
                      className="px-4 py-3 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 font-semibold hover:bg-blue-600/25 transition-all">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {data.projects.filter(Boolean).map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/60 bg-white/4 px-3 py-2 rounded-lg border border-white/8">
                        <span className="flex-1 truncate">{p}</span>
                        <button onClick={() => set('projects', data.projects.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400 transition-all">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {step === 'preview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Eye className="h-5 w-5 text-blue-400" />Your Resume is Ready</h2>

                {/* Summary */}
                <div className="rounded-2xl p-6 border border-white/8 bg-white/3 space-y-3">
                  <p className="text-3xl font-black text-white">{data.name || 'Your Name'}</p>
                  <p className="text-white/50 text-sm">{[data.email, data.phone, data.location].filter(Boolean).join(' · ')}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full font-semibold">
                      {data.workExp.length} jobs
                    </span>
                    <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full font-semibold">
                      {data.education.length} degrees
                    </span>
                    <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full font-semibold">
                      {data.skills.length} skills
                    </span>
                  </div>
                </div>

                {/* Download options */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Free — with watermark */}
                  <div className="rounded-2xl p-6 border border-white/8 bg-white/3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Free Preview</p>
                        <p className="text-xs text-white/40">CraftlyCV watermark</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mb-4 leading-relaxed">
                      View your complete resume with a CraftlyCV.in watermark. Great to check how it looks before upgrading.
                    </p>
                    <button onClick={() => openPreview(false)}
                      className="w-full py-3 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 text-sm font-bold hover:bg-blue-600/25 transition-all">
                      Preview with Watermark
                    </button>
                  </div>

                  {/* Pro — clean */}
                  <div className={`rounded-2xl p-6 border relative overflow-hidden ${isPro ? 'border-purple-500/30 bg-purple-500/6' : 'border-white/8 bg-white/3'}`}>
                    {!isPro && <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                      <div className="text-center">
                        <Lock className="h-8 w-8 text-white/50 mx-auto mb-2" />
                        <p className="text-white/70 text-sm font-bold">Pro Feature</p>
                      </div>
                    </div>}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                        <Download className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Clean Download</p>
                        <p className="text-xs text-purple-400 font-semibold">Pro · No watermark</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mb-4 leading-relaxed">
                      Download as PDF or DOCX with no watermark. Professional, ready to send to recruiters.
                    </p>
                    {isPro ? (
                      <div className="space-y-2">
                        <button onClick={() => openPreview(true)} className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all">
                          Download PDF (Ctrl+P → Save)
                        </button>
                      </div>
                    ) : (
                      <Link href="/pricing">
                        <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">
                          Upgrade to Pro →
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Analyze CTA */}
                <div className="rounded-2xl p-6 border border-orange-500/20 bg-orange-500/6 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold text-white mb-1">Now analyze this resume's ATS score</p>
                    <p className="text-sm text-white/50">Download your resume, then upload it to our ATS Analyzer to see your score and get improvements.</p>
                  </div>
                  <Link href="/analyze">
                    <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 font-bold text-sm hover:bg-orange-500/25 transition-all whitespace-nowrap">
                      <Target className="h-4 w-4" />Analyze Score →
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Step Navigation */}
          <div className="flex justify-between">
            <button onClick={goPrev} disabled={stepIdx === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/6 border border-white/10 text-white/60 hover:text-white text-sm font-semibold disabled:opacity-30 transition-all">
              <ArrowLeft className="h-4 w-4" />Back
            </button>
            {step !== 'preview' ? (
              <button onClick={goNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link href="/analyze">
                <button className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all">
                  <Target className="h-4 w-4" />Analyze My Score
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

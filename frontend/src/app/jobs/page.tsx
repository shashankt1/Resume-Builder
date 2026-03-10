'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowLeft, Briefcase, Loader2, Upload, X, Zap, Sun, Moon, ExternalLink, BookOpen, Code2, ArrowRightCircle, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface JobRole { title: string; matchPercent: number; reason: string; salaryRange: string }
interface CareerPath { from: string; to: string; timeframe: string; steps: string[] }
interface FreelancePath { platform: string; url: string; niche: string; howToStart: string[]; earnings: string }
interface Course { name: string; provider: string; url: string; free: boolean }
interface JobResult {
  currentLevel: string
  jobRoles: JobRole[]
  careerSwitch: CareerPath | null
  freelancePaths: FreelancePath[]
  courses: Course[]
  certifications: string[]
  dsaTopics: string[] | null
  summary: string
}

const JOB_SEARCH_SITES = [
  { name: 'Naukri', url: 'https://www.naukri.com/jobs-in-india', color: 'bg-blue-600' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs', color: 'bg-sky-700' },
  { name: 'Indeed', url: 'https://in.indeed.com', color: 'bg-indigo-600' },
  { name: 'Internshala', url: 'https://internshala.com/jobs', color: 'bg-green-600' },
]

const FREELANCE_PLATFORMS = [
  { name: 'Upwork', url: 'https://www.upwork.com' },
  { name: 'Fiverr', url: 'https://www.fiverr.com' },
  { name: 'Freelancer', url: 'https://www.freelancer.com' },
  { name: 'Toptal', url: 'https://www.toptal.com' },
]

export default function JobsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<JobResult | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userScans, setUserScans] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
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

  const handleFile = (f: File) => {
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) {
      toast.error('Only PDF or DOCX'); return
    }
    setFile(f); setResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const analyze = async () => {
    if (!file) { toast.error('Upload your resume'); return }
    if (userScans < 1) { toast.error('Need 1 scan'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId!)
      const res = await fetch('/api/ai/jobs', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setUserScans(prev => prev - 1)
      toast.success('Career suggestions ready!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  const searchJob = (title: string, site: typeof JOB_SEARCH_SITES[0]) => {
    const query = encodeURIComponent(title)
    const searchUrls: Record<string, string> = {
      'Naukri': `https://www.naukri.com/${title.toLowerCase().replace(/\s+/g, '-')}-jobs`,
      'LinkedIn Jobs': `https://www.linkedin.com/jobs/search/?keywords=${query}`,
      'Indeed': `https://in.indeed.com/jobs?q=${query}`,
      'Internshala': `https://internshala.com/jobs/${title.toLowerCase().replace(/\s+/g, '-')}-jobs`,
    }
    window.open(searchUrls[site.name] || site.url, '_blank')
  }

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
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg"><Briefcase className="h-6 w-6 text-amber-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Job & Career Suggester</h1>
            <p className="text-muted-foreground">AI analyzes your resume and maps your career path · 1 scan</p>
          </div>
        </div>

        {!result ? (
          <Card className="max-w-lg mx-auto">
            <CardHeader><CardTitle>Upload Your Resume</CardTitle><CardDescription>We'll analyze your skills and suggest the best opportunities</CardDescription></CardHeader>
            <CardContent>
              <div
                onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                onClick={() => !file && inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all mb-4 ${dragging ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : file ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default' : 'border-slate-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer'}`}
              >
                <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {file ? (
                  <div className="flex items-center gap-3 text-left">
                    <FileText className="h-6 w-6 text-green-600" />
                    <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setFile(null) }}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <><Upload className="h-12 w-12 mx-auto mb-3 text-slate-300" /><p className="font-medium">Drag & drop or click to upload</p><p className="text-sm text-muted-foreground">PDF or DOCX</p></>
                )}
              </div>
              <Button onClick={analyze} disabled={loading || !file || userScans < 1} className="w-full bg-amber-600 hover:bg-amber-700 text-white" size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing career path...</> : <><Briefcase className="mr-2 h-4 w-4" />Analyze My Career (1 scan)</>}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="py-5">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Current Level: {result.currentLevel}</span>
                </div>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Job Roles */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-5 w-5 text-amber-600" /> Recommended Job Roles</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {result.jobRoles.map((job, i) => (
                  <Card key={i} className="hover:shadow-md transition-all">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">{job.title}</p>
                        <Badge className="bg-green-100 text-green-700">{job.matchPercent}% match</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{job.reason}</p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">💰 {job.salaryRange}</p>
                      <div className="flex flex-wrap gap-1">
                        {JOB_SEARCH_SITES.map(site => (
                          <Button key={site.name} size="sm" className={`text-xs text-white ${site.color} hover:opacity-90 h-7 px-2`} onClick={() => searchJob(job.title, site)}>
                            {site.name} <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Career Switch */}
            {result.careerSwitch && (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <ArrowRightCircle className="h-5 w-5" /> Career Switch Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline">{result.careerSwitch.from}</Badge>
                    <ArrowRightCircle className="h-4 w-4 text-purple-600" />
                    <Badge className="bg-purple-600 text-white">{result.careerSwitch.to}</Badge>
                    <span className="text-sm text-muted-foreground">· {result.careerSwitch.timeframe}</span>
                  </div>
                  <ul className="space-y-2">
                    {result.careerSwitch.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Freelance Guide */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">💼 Freelance Opportunities</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {result.freelancePaths.map((fp, i) => (
                  <Card key={i}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{fp.niche}</p>
                        <a href={fp.url} target="_blank" rel="noreferrer">
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 cursor-pointer hover:bg-orange-200">
                            {fp.platform} <ExternalLink className="ml-1 h-3 w-3 inline" />
                          </Badge>
                        </a>
                      </div>
                      <p className="text-xs font-medium text-green-600 mb-2">💰 {fp.earnings}</p>
                      <ul className="space-y-1">
                        {fp.howToStart.map((step, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-orange-500 shrink-0">→</span> {step}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <p className="text-sm text-muted-foreground w-full">Explore all freelance platforms:</p>
                {FREELANCE_PLATFORMS.map(p => (
                  <a key={p.name} href={p.url} target="_blank" rel="noreferrer">
                    <Badge variant="outline" className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">{p.name} <ExternalLink className="ml-1 h-3 w-3 inline" /></Badge>
                  </a>
                ))}
              </div>
            </div>

            {/* Courses */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" /> Recommended Courses</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {result.courses.map((c, i) => (
                    <a key={i} href={c.url} target="_blank" rel="noreferrer" className="block p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.provider}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge className={c.free ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>{c.free ? 'Free' : 'Paid'}</Badge>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2">🏆 Certifications to Pursue</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.certifications.map((cert, i) => (
                    <Badge key={i} variant="secondary" className="text-sm py-1 px-3">{cert}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* DSA Topics */}
            {result.dsaTopics && result.dsaTopics.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Code2 className="h-5 w-5 text-green-600" /> DSA Topics to Practice</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.dsaTopics.map((topic, i) => (
                      <a key={i} href={`https://leetcode.com/tag/${topic.toLowerCase().replace(/\s+/g, '-')}`} target="_blank" rel="noreferrer">
                        <Badge variant="outline" className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-400">
                          {topic} <ExternalLink className="ml-1 h-3 w-3 inline" />
                        </Badge>
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Click any topic to practice on LeetCode</p>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => { setResult(null); setFile(null) }} variant="outline" className="w-full">Analyze Another Resume</Button>
          </div>
        )}
      </div>
    </div>
  )
}

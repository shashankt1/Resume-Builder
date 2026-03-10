'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { FileText, ArrowLeft, Sparkles, Loader2, Upload, X, CheckCircle, Zap, FileDown, FileType, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface TailorResult {
  tailoredText: string
  docxBase64: string
  pdfHtmlBase64: string
  matchScore: number
  improvements: string[]
}

export default function TailorPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TailorResult | null>(null)
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
      const { data: profile } = await supabase.from('profiles').select('scans, plan').eq('id', user.id).single()
      if (profile) {
        if (profile.plan !== 'pro' && profile.plan !== 'enterprise') {
          toast.error('Pro plan required'); router.push('/pricing'); return
        }
        setUserScans(profile.scans)
      }
    }
    check()
  }, [])

  const handleFile = (f: File) => {
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) {
      toast.error('Only PDF or DOCX accepted'); return
    }
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setFile(f); setResult(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const tailorResume = async () => {
    if (!file || !jobDescription.trim()) { toast.error('Upload resume and paste job description'); return }
    if (userScans < 3) { toast.error('Need 3 scans'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId!)
      formData.append('jobDescription', jobDescription)
      const res = await fetch('/api/ai/tailor', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setUserScans(prev => prev - 3)
      toast.success('Resume tailored successfully!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to tailor resume')
    } finally { setLoading(false) }
  }

  const downloadDocx = () => {
    if (!result?.docxBase64) return
    const bytes = Uint8Array.from(atob(result.docxBase64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'tailored-resume.docx'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = () => {
    if (!result?.pdfHtmlBase64) return
    const html = atob(result.pdfHtmlBase64)
    const w = window.open('', '_blank')
    if (!w) { toast.error('Allow popups to download PDF'); return }
    w.document.write(html); w.document.close(); w.focus()
    setTimeout(() => w.print(), 500)
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
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg"><Sparkles className="h-6 w-6 text-purple-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Tailor to Job</h1>
            <p className="text-muted-foreground">AI rewrites your resume to match any job description · 3 scans</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Your Resume</CardTitle><CardDescription>PDF or DOCX, max 5MB</CardDescription></CardHeader>
              <CardContent>
                <div
                  onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                  onClick={() => !file && inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : file ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default' : 'border-slate-200 dark:border-slate-700 hover:border-purple-400 cursor-pointer'}`}
                >
                  <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg"><FileText className="h-6 w-6 text-green-600" /></div>
                      <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{file.name}</p></div>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setFile(null); setResult(null) }}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <><Upload className="h-10 w-10 mx-auto mb-3 text-slate-300" /><p className="font-medium mb-1">{dragging ? 'Drop here!' : 'Drag & drop or click'}</p><p className="text-sm text-muted-foreground">PDF or DOCX</p></>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Job Description</CardTitle><CardDescription>Paste the full job posting</CardDescription></CardHeader>
              <CardContent>
                <Textarea placeholder="Paste the job description here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="min-h-[200px] resize-none" />
                <p className="text-xs text-muted-foreground mt-2">{jobDescription.length} characters</p>
              </CardContent>
            </Card>

            <Button onClick={tailorResume} disabled={loading || !file || !jobDescription.trim() || userScans < 3} className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tailoring...</> : <><Sparkles className="mr-2 h-4 w-4" />Tailor Resume (3 scans)</>}
            </Button>
          </div>

          <div>
            {result ? (
              <div className="space-y-4">
                <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="py-5 text-center">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">{result.matchScore}%</p>
                    <p className="font-medium text-green-700 dark:text-green-400">Job Match Score</p>
                    <p className="text-sm text-muted-foreground mt-1">Your resume now matches this job</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">What was improved</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{imp}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                  <CardContent className="py-5">
                    <p className="font-semibold text-purple-700 dark:text-purple-300 mb-3">Download Tailored Resume</p>
                    <div className="flex gap-3">
                      <Button onClick={downloadPdf} className="bg-red-600 hover:bg-red-700 text-white flex-1"><FileDown className="mr-2 h-4 w-4" />PDF</Button>
                      <Button onClick={downloadDocx} className="bg-blue-600 hover:bg-blue-700 text-white flex-1"><FileType className="mr-2 h-4 w-4" />DOCX</Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">PDF: press Ctrl+P → Save as PDF</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground py-12">
                  <Sparkles className="h-14 w-14 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Upload resume + paste job description</p>
                  <p className="text-sm mt-1">AI will rewrite it to perfectly match the role</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

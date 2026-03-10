'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileText, ArrowLeft, MessageSquare, Loader2, Upload, X, Zap, Sun, Moon, ChevronRight, CheckCircle, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface Question { question: string; category: string; difficulty: 'Easy' | 'Medium' | 'Hard' }
interface AnswerFeedback { score: number; feedback: string; betterAnswer: string }

type Stage = 'setup' | 'questions' | 'done'

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage>('setup')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedbacks, setFeedbacks] = useState<AnswerFeedback[]>([])
  const [gradingAnswer, setGradingAnswer] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userScans, setUserScans] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

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
      toast.error('Only PDF or DOCX'); return
    }
    setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const generateQuestions = async () => {
    if (!file || !jobTitle.trim()) { toast.error('Upload resume and enter job title'); return }
    if (userScans < 5) { toast.error('Need 5 scans'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId!)
      formData.append('jobTitle', jobTitle)
      if (jobDescription.trim()) formData.append('jobDescription', jobDescription)
      const res = await fetch('/api/ai/interview', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuestions(data.questions)
      setUserScans(prev => prev - 5)
      setStage('questions')
      toast.success('10 questions generated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { toast.error('Voice not supported in this browser'); return }
    const recognition = new SpeechRecognition()
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US'
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setAnswer(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.start(); recognitionRef.current = recognition; setListening(true)
  }

  const submitAnswer = async () => {
    if (!answer.trim()) { toast.error('Please provide an answer'); return }
    setGradingAnswer(true)
    try {
      const res = await fetch('/api/ai/interview-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questions[currentQ].question, answer, jobTitle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFeedbacks(prev => [...prev, data])
      setAnswer('')
      if (currentQ + 1 >= questions.length) setStage('done')
      else setCurrentQ(prev => prev + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Grading failed')
    } finally { setGradingAnswer(false) }
  }

  const avgScore = feedbacks.length > 0 ? Math.round(feedbacks.reduce((s, f) => s + f.score, 0) / feedbacks.length) : 0
  const diffColor = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-yellow-100 text-yellow-700', Hard: 'bg-red-100 text-red-700' }

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

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg"><MessageSquare className="h-6 w-6 text-green-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Interview Prep</h1>
            <p className="text-muted-foreground">AI-generated questions tailored to your resume & JD · 5 scans</p>
          </div>
        </div>

        {stage === 'setup' && (
          <div className="space-y-4">
            {/* Resume Upload */}
            <Card>
              <CardHeader><CardTitle>Your Resume</CardTitle><CardDescription>PDF or DOCX, max 5MB</CardDescription></CardHeader>
              <CardContent>
                <div
                  onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                  onClick={() => !file && inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragging ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : file ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default' : 'border-slate-200 dark:border-slate-700 hover:border-green-400 cursor-pointer'}`}
                >
                  <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex items-center gap-3 text-left">
                      <FileText className="h-6 w-6 text-green-600" />
                      <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setFile(null) }}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <><Upload className="h-10 w-10 mx-auto mb-3 text-slate-300" /><p className="font-medium">Upload your resume</p><p className="text-sm text-muted-foreground">PDF or DOCX</p></>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Job Title */}
            <Card>
              <CardHeader><CardTitle>Job Title</CardTitle><CardDescription>What role are you interviewing for?</CardDescription></CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g. Frontend Developer, Data Analyst, Product Manager"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Job Description — NEW */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description <span className="text-muted-foreground text-sm font-normal">(optional but recommended)</span></CardTitle>
                <CardDescription>Paste the JD to get questions tailored to exactly what this company is looking for</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={"Paste the job description here...\n\nExample:\nWe are looking for a Senior Data Analyst with experience in SQL, Python, Tableau...\n• 3+ years of experience\n• Strong communication skills\n• Experience with A/B testing..."}
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  className="min-h-[160px] resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">{jobDescription.length} characters · More detail = more targeted questions</p>
              </CardContent>
            </Card>

            <Button
              onClick={generateQuestions}
              disabled={loading || !file || !jobTitle.trim() || userScans < 5}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating questions...</>
                : <><MessageSquare className="mr-2 h-4 w-4" />Generate 10 Questions (5 scans)</>
              }
            </Button>
          </div>
        )}

        {stage === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Question {currentQ + 1} of {questions.length}</p>
              <p className="text-sm font-medium">{feedbacks.length} answered</p>
            </div>
            <Progress value={(currentQ / questions.length) * 100} className="h-2 mb-4" />

            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={diffColor[questions[currentQ].difficulty]}>{questions[currentQ].difficulty}</Badge>
                  <Badge variant="outline">{questions[currentQ].category}</Badge>
                </div>
                <p className="text-lg font-semibold leading-relaxed">{questions[currentQ].question}</p>
              </CardContent>
            </Card>

            {feedbacks.length > 0 && feedbacks[currentQ - 1] && (
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="py-4">
                  <p className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4" /> Previous answer score: {feedbacks[currentQ - 1].score}/10
                  </p>
                  <p className="text-sm text-muted-foreground">{feedbacks[currentQ - 1].feedback}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Your Answer</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Type your answer or use the microphone..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="min-h-[140px] resize-none mb-3"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={toggleVoice} className={`flex items-center gap-2 ${listening ? 'border-red-400 text-red-600 bg-red-50' : ''}`}>
                    {listening ? '⏹ Stop Recording' : '🎤 Voice Answer'}
                  </Button>
                  <Button onClick={submitAnswer} disabled={gradingAnswer || !answer.trim()} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    {gradingAnswer ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Grading...</> : <>Submit Answer <ChevronRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {stage === 'done' && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200">
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
                <p className="text-3xl font-bold">{avgScore}/10</p>
                <p className="text-lg font-medium text-muted-foreground mt-1">Average Score</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {avgScore >= 8 ? '🎉 Excellent! You\'re well prepared.' : avgScore >= 6 ? '👍 Good job! A bit more practice will help.' : '📚 Keep practicing — you\'re improving!'}
                </p>
              </CardContent>
            </Card>

            <h2 className="font-semibold text-lg">Detailed Feedback</h2>
            {questions.map((q, i) => (
              feedbacks[i] && (
                <Card key={i}>
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <p className="font-medium text-sm flex-1">{q.question}</p>
                      <Badge className={feedbacks[i].score >= 8 ? 'bg-green-100 text-green-700' : feedbacks[i].score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                        {feedbacks[i].score}/10
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{feedbacks[i].feedback}</p>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">Suggested better answer:</p>
                      <p className="text-sm">{feedbacks[i].betterAnswer}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}

            <div className="flex gap-3">
              <Button onClick={() => { setStage('setup'); setFeedbacks([]); setCurrentQ(0); setQuestions([]) }} variant="outline" className="flex-1">New Session</Button>
              <Link href="/dashboard" className="flex-1"><Button className="w-full">Back to Dashboard</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

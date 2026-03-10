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
import { FileText, ArrowLeft, Mic, Loader2, Upload, X, Zap, Sun, Moon, Send, MicOff, Volume2, Star, CheckCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface Message { role: 'interviewer' | 'candidate'; content: string; score?: number; feedback?: string }
type Stage = 'setup' | 'interview' | 'done'

export default function MockInterviewPage() {
  const [file, setFile] = useState<File | null>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [stage, setStage] = useState<Stage>('setup')
  const [messages, setMessages] = useState<Message[]>([])
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [listening, setListening] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userScans, setUserScans] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [speaking, setSpeaking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const MAX_QUESTIONS = 8

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

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

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

  const startInterview = async () => {
    if (!file || !jobTitle.trim()) { toast.error('Upload resume and enter job title'); return }
    if (userScans < 5) { toast.error('Need 5 scans'); return }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId!)
      formData.append('jobTitle', jobTitle)
      formData.append('action', 'start')
      const res = await fetch('/api/ai/mock-interview', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSessionId(data.sessionId)
      setMessages([{ role: 'interviewer', content: data.firstQuestion }])
      setQuestionCount(1)
      setUserScans(prev => prev - 5)
      setStage('interview')
      speakText(data.firstQuestion)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start')
    } finally { setLoading(false) }
  }

  const sendAnswer = async () => {
    if (!answer.trim()) { toast.error('Please give an answer'); return }
    const userMsg: Message = { role: 'candidate', content: answer }
    setMessages(prev => [...prev, userMsg])
    setAnswer('')
    setSending(true)
    try {
      const isLast = questionCount >= MAX_QUESTIONS
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLast ? 'finish' : 'continue',
          sessionId,
          answer,
          jobTitle,
          questionCount,
          history: messages,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const feedback: Message = {
        role: 'interviewer',
        content: isLast ? data.closingMessage : data.feedback + '\n\n' + data.nextQuestion,
        score: data.score,
        feedback: data.feedbackDetail,
      }
      setMessages(prev => [...prev, feedback])
      if (data.score) setScores(prev => [...prev, data.score])
      if (isLast) setStage('done')
      else {
        setQuestionCount(prev => prev + 1)
        speakText(data.nextQuestion)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally { setSending(false) }
  }

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9; utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { toast.error('Voice not supported in this browser. Use Chrome.'); return }
    const r = new SR()
    r.continuous = true; r.interimResults = true; r.lang = 'en-US'
    r.onresult = (e: any) => setAnswer(Array.from(e.results).map((x: any) => x[0].transcript).join(''))
    r.onend = () => setListening(false)
    r.start(); recognitionRef.current = r; setListening(true)
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

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
          <div className="p-2 bg-rose-100 dark:bg-rose-900 rounded-lg"><Mic className="h-6 w-6 text-rose-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">AI Mock Interview</h1>
            <p className="text-muted-foreground">Real-time interview with voice + text · 5 scans · Pro</p>
          </div>
        </div>

        {/* Setup */}
        {stage === 'setup' && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Upload Resume</CardTitle><CardDescription>The AI will tailor questions to your experience</CardDescription></CardHeader>
              <CardContent>
                <div
                  onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
                  onClick={() => !file && inputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragging ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' : file ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default' : 'border-slate-200 dark:border-slate-700 hover:border-rose-400 cursor-pointer'}`}
                >
                  <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex items-center gap-3 text-left">
                      <FileText className="h-6 w-6 text-green-600" />
                      <span className="flex-1 font-medium text-sm truncate">{file.name}</span>
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setFile(null) }}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <><Upload className="h-10 w-10 mx-auto mb-3 text-slate-300" /><p className="font-medium">Upload your resume</p><p className="text-sm text-muted-foreground">PDF or DOCX</p></>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Target Role</CardTitle></CardHeader>
              <CardContent>
                <Input placeholder="e.g. React Developer, Data Scientist, Product Manager" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
              </CardContent>
            </Card>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-lg p-4 text-sm text-rose-700 dark:text-rose-300">
              <p className="font-medium mb-1">How this works:</p>
              <ul className="space-y-1 list-disc ml-4">
                <li>AI asks {MAX_QUESTIONS} interview questions tailored to your resume</li>
                <li>Answer by typing or using your microphone</li>
                <li>Get scored and feedback after each answer</li>
                <li>Receive overall session report at the end</li>
              </ul>
            </div>

            <Button onClick={startInterview} disabled={loading || !file || !jobTitle.trim() || userScans < 5} className="w-full bg-rose-600 hover:bg-rose-700 text-white" size="lg">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting interview...</> : <><Mic className="mr-2 h-4 w-4" />Start Mock Interview (5 scans)</>}
            </Button>
          </div>
        )}

        {/* Interview Chat */}
        {stage === 'interview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Question {questionCount} of {MAX_QUESTIONS}</Badge>
              <div className="flex items-center gap-2">
                {speaking && <span className="text-xs text-rose-600 flex items-center gap-1"><Volume2 className="h-3 w-3" /> Speaking...</span>}
                <Button variant="ghost" size="sm" onClick={() => window.speechSynthesis?.cancel()}>Mute</Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 pb-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'interviewer' ? 'bg-white dark:bg-slate-800 border shadow-sm' : 'bg-rose-600 text-white'}`}>
                    {msg.role === 'interviewer' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                          <Mic className="h-3 w-3 text-rose-600" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">AI Interviewer</span>
                        {msg.score && <Badge className="bg-green-100 text-green-700 text-xs">{msg.score}/10</Badge>}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border rounded-2xl px-4 py-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="border rounded-xl p-3 bg-white dark:bg-slate-900">
              <Textarea
                placeholder="Type your answer... or use the microphone"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="border-0 focus-visible:ring-0 resize-none min-h-[80px] p-0"
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) sendAnswer() }}
              />
              <div className="flex items-center justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={toggleVoice} className={`flex items-center gap-2 ${listening ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : ''}`}>
                  {listening ? <><MicOff className="h-4 w-4" /> Stop</> : <><Mic className="h-4 w-4" /> Voice</>}
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Ctrl+Enter to send</span>
                  <Button onClick={sendAnswer} disabled={sending || !answer.trim()} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Done */}
        {stage === 'done' && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-950/30 dark:to-purple-950/30 border-rose-200">
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
                <p className="text-4xl font-bold">{avgScore}/10</p>
                <p className="text-lg font-medium text-muted-foreground">Overall Interview Score</p>
                <p className="text-sm mt-2">
                  {avgScore >= 8 ? '🎉 Outstanding! You\'re ready for the real thing.' : avgScore >= 6 ? '👍 Good performance! A few more sessions will make you ready.' : '📚 Keep practicing — every session makes you stronger!'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Interview Transcript</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {messages.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'interviewer' ? 'bg-slate-50 dark:bg-slate-800' : 'bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-400'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">{msg.role === 'interviewer' ? '🤖 AI Interviewer' : '👤 You'}</span>
                        {msg.score && <Badge className="bg-green-100 text-green-700 text-xs">{msg.score}/10</Badge>}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => { setStage('setup'); setMessages([]); setScores([]); setQuestionCount(0); setSessionId(null) }} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" /> New Session
              </Button>
              <Link href="/dashboard" className="flex-1"><Button className="w-full">Back to Dashboard</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

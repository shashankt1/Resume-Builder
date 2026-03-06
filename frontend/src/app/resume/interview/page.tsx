'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, ArrowLeft, MessageSquare, Loader2, Lightbulb } from 'lucide-react'

interface Question {
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  tips: string
}

export default function InterviewPrepPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth')
      } else {
        setUserId(user.id)
      }
    })

    // Load saved resume
    const saved = localStorage.getItem('craftlycv_resume')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        let text = ''
        const { personalInfo, summary, experience, education, skills } = data

        if (personalInfo?.fullName) text += `${personalInfo.fullName}\n`
        if (summary) text += `${summary}\n\n`
        if (experience?.length) {
          experience.forEach((exp: any) => {
            text += `${exp.position} at ${exp.company}\n${exp.description}\n\n`
          })
        }
        if (skills?.length) {
          text += `Skills: ${skills.join(', ')}`
        }

        if (text.trim()) {
          setResumeText(text)
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [router, supabase])

  const generateQuestions = async () => {
    if (!jobTitle.trim() || !resumeText.trim()) {
      setError('Please enter job title and resume text')
      return
    }

    setLoading(true)
    setError(null)
    setQuestions([])

    try {
      const response = await fetch('/api/ai/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          resumeText,
          count: 10,
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions')
      }

      setQuestions(data.questions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical': return 'bg-blue-100 text-blue-800'
      case 'behavioral': return 'bg-purple-100 text-purple-800'
      case 'situational': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const groupedQuestions = questions.reduce((acc, q) => {
    const cat = q.category.toLowerCase()
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(q)
    return acc
  }, {} as Record<string, Question[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">CraftlyCV</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Preparation</h1>
            <p className="text-gray-600">Generate tailored interview questions for your target role</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Enter the job you're applying for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here for more relevant questions..."
                  className="min-h-[100px]"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="resumeText">Your Resume *</Label>
                <Textarea
                  id="resumeText"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Your resume text will be loaded from the builder..."
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
              <Button
                onClick={generateQuestions}
                disabled={loading || !jobTitle.trim() || !resumeText.trim()}
                className="w-full"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><MessageSquare className="mr-2 h-4 w-4" /> Generate Questions (2 credits)</>
                )}
              </Button>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Questions Display */}
          <div className="lg:col-span-2">
            {questions.length > 0 ? (
              <Tabs defaultValue={Object.keys(groupedQuestions)[0] || 'all'} className="w-full">
                <TabsList className="mb-4">
                  {Object.keys(groupedQuestions).map((category) => (
                    <TabsTrigger key={category} value={category} className="capitalize">
                      {category} ({groupedQuestions[category].length})
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                  <TabsContent key={category} value={category}>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        {categoryQuestions.map((q, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base font-medium pr-4">
                                  {q.question}
                                </CardTitle>
                                <div className="flex space-x-2 flex-shrink-0">
                                  <Badge className={getCategoryColor(q.category)}>
                                    {q.category}
                                  </Badge>
                                  <Badge className={getDifficultyColor(q.difficulty)}>
                                    {q.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-start space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span><strong>Tip:</strong> {q.tips}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[600px]">
                <CardContent className="text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">Enter job details and your resume to generate tailored interview questions</p>
                  <p className="text-sm">Questions will be customized based on your experience and target role</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

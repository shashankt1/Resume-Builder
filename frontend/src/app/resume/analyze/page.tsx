'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowLeft, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface AnalysisResult {
  score: number
  strengths: string[]
  improvements: string[]
  summary: string
}

export default function AnalyzeResumePage() {
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
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
        // Generate text from resume data
        let text = ''
        const { personalInfo, summary, experience, education, skills } = data

        if (personalInfo?.fullName) text += `${personalInfo.fullName}\n`
        if (personalInfo?.email) text += `${personalInfo.email} | ${personalInfo.phone || ''} | ${personalInfo.location || ''}\n\n`
        if (summary) text += `SUMMARY\n${summary}\n\n`
        if (experience?.length) {
          text += 'EXPERIENCE\n'
          experience.forEach((exp: any) => {
            text += `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n${exp.description}\n\n`
          })
        }
        if (education?.length) {
          text += 'EDUCATION\n'
          education.forEach((edu: any) => {
            text += `${edu.degree} in ${edu.field} - ${edu.institution} (${edu.graduationDate})\n`
          })
          text += '\n'
        }
        if (skills?.length) {
          text += `SKILLS\n${skills.join(', ')}`
        }

        if (text.trim()) {
          setResumeText(text)
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [router, supabase])

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Improvement'
    return 'Poor'
  }

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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Resume Analysis</h1>
            <p className="text-gray-600">Get instant feedback on your resume</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Your Resume</CardTitle>
              <CardDescription>Paste your resume text or it will be loaded from the builder</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="min-h-[400px] font-mono text-sm"
              />
              <Button
                onClick={analyzeResume}
                disabled={loading || !resumeText.trim()}
                className="w-full mt-4"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Analyze Resume (1 credit)</>
                )}
              </Button>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Score */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resume Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}
                      </div>
                      <div className={`text-lg ${getScoreColor(result.score)}`}>
                        {getScoreLabel(result.score)}
                      </div>
                      <Progress value={result.score} className="mt-4" />
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{result.summary}</p>
                  </CardContent>
                </Card>

                {/* Strengths */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <Badge variant="secondary" className="mr-2 mt-0.5 bg-green-100 text-green-800">
                            {index + 1}
                          </Badge>
                          <span className="text-gray-600">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Improvements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start">
                          <Badge variant="secondary" className="mr-2 mt-0.5 bg-yellow-100 text-yellow-800">
                            {index + 1}
                          </Badge>
                          <span className="text-gray-600">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Enter your resume text and click "Analyze" to get AI-powered feedback</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

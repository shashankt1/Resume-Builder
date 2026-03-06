import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy initialization - only creates instance when actually needed
let genAIInstance: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Please add it to your environment variables.')
    }
    genAIInstance = new GoogleGenerativeAI(apiKey)
  }
  return genAIInstance
}

export interface ATSAnalysisResult {
  score: number
  keywordMatches: string[]
  missingKeywords: string[]
  strengths: string[]
  improvements: string[]
  summary: string
}

export async function analyzeResumeATS(resumeText: string): Promise<ATSAnalysisResult> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume and provide a detailed assessment.

Provide your response in JSON format with these exact keys:
- score: number from 0-100 representing ATS compatibility
- keywordMatches: array of strong keywords found in the resume
- missingKeywords: array of common industry keywords that are missing
- strengths: array of 3-5 things done well
- improvements: array of 3-5 specific actionable improvements
- summary: 2-3 sentence overall assessment

Resume:
${resumeText}

Respond ONLY with valid JSON, no markdown or explanation.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Ensure all fields exist with defaults
    return {
      score: parsed.score || 50,
      keywordMatches: parsed.keywordMatches || [],
      missingKeywords: parsed.missingKeywords || [],
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      summary: parsed.summary || 'Analysis complete.'
    }
  } catch (error) {
    throw new Error(`Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobTitle?: string,
  count: number = 10
): Promise<{
  questions: Array<{
    question: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard'
    idealAnswer: string
  }>
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Based on this resume${jobTitle ? ` for a ${jobTitle} position` : ''}, generate ${count} interview questions.

Resume:
${resumeText}

Generate questions covering:
- Technical skills mentioned
- Behavioral scenarios
- Situational challenges
- Experience verification

Respond in JSON format with a "questions" array where each item has:
- question: the interview question
- category: "technical", "behavioral", "situational", or "experience"
- difficulty: "easy", "medium", or "hard"
- idealAnswer: a brief ideal response (2-3 sentences)

Respond ONLY with valid JSON.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`Interview questions generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function tailorResumeToJob(
  resumeText: string,
  jobDescription: string
): Promise<{
  tailoredResume: string
  changes: string[]
  matchScore: number
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are an expert resume writer. Tailor this resume to match the job description while keeping it authentic and ATS-friendly.

Original Resume:
${resumeText}

Job Description:
${jobDescription}

Provide your response in JSON format:
- tailoredResume: the full rewritten resume text optimized for this job
- changes: array of specific changes made (e.g., "Added keyword 'Python' to skills")
- matchScore: estimated ATS match score 0-100 after tailoring

Respond ONLY with valid JSON.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`Resume tailoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

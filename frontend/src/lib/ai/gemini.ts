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

export async function analyzeResume(resumeText: string): Promise<{
  score: number
  strengths: string[]
  improvements: string[]
  summary: string
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Analyze the following resume and provide:
1. An overall score from 0-100
2. A list of 3-5 key strengths
3. A list of 3-5 areas for improvement
4. A brief summary (2-3 sentences)

Respond in JSON format with keys: score, strengths, improvements, summary

Resume:
${resumeText}`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    throw new Error(`Resume analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function generateInterviewQuestions(
  jobTitle: string,
  jobDescription: string,
  resumeText: string,
  count: number = 10
): Promise<{
  questions: Array<{
    question: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard'
    tips: string
  }>
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Based on the job title, description, and candidate's resume below, generate ${count} tailored interview questions.

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Candidate's Resume:
${resumeText}

Generate questions that:
1. Are specific to this role and candidate
2. Cover technical skills, behavioral aspects, and situational scenarios
3. Range from easy to hard difficulty
4. Include tips for answering each question

Respond in JSON format with a "questions" array, where each question has:
- question: the interview question
- category: "technical", "behavioral", "situational", or "general"
- difficulty: "easy", "medium", or "hard"
- tips: brief advice for answering`

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

export async function enhanceResumeSection(
  section: string,
  currentContent: string,
  targetRole?: string
): Promise<{ enhancedContent: string; suggestions: string[] }> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Enhance the following resume section to make it more impactful and ATS-friendly.

Section: ${section}
Current Content:
${currentContent}
${targetRole ? `Target Role: ${targetRole}` : ''}

Provide:
1. Enhanced version of the content
2. 3-5 specific suggestions for improvement

Respond in JSON format with keys: enhancedContent, suggestions (array of strings)`

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
    throw new Error(`Section enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

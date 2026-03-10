import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') return (await require('pdf-parse')(buffer)).text
  return (await require('mammoth').extractRawText({ buffer })).value
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // START action: from formData with file
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const userId = formData.get('userId') as string
      const jobTitle = formData.get('jobTitle') as string

      const supabase = await createAdminClient()
      const { data: profile } = await supabase.from('profiles').select('scans').eq('id', userId).single()
      if (!profile || profile.scans < 5) return NextResponse.json({ error: 'Need 5 scans' }, { status: 402 })

      const resumeText = await extractText(file)

      const prompt = `You are a professional interviewer conducting an interview for a ${jobTitle} position.

Resume summary:
${resumeText.substring(0, 2000)}

Start the interview with a warm greeting, introduce yourself briefly as the interviewer, then ask your first interview question. The question should be tailored to their experience. Be conversational and professional.

Keep the greeting + first question under 100 words total.`

      const result = await model.generateContent(prompt)
      const firstQuestion = result.response.text()
      const sessionId = randomUUID()

      await supabase.from('profiles').update({ scans: profile.scans - 5 }).eq('id', userId)
      await supabase.from('scan_logs').insert({ user_id: userId, action_type: 'mock_interview', scans_used: 5, created_at: new Date().toISOString() })

      return NextResponse.json({ sessionId, firstQuestion })
    }

    // CONTINUE / FINISH action: from JSON
    const body = await request.json()
    const { action, answer, jobTitle, questionCount, history } = body

    if (action === 'continue') {
      const historyText = (history || []).map((m: any) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')

      const prompt = `You are interviewing for a ${jobTitle} role.

Conversation so far:
${historyText}

Latest answer from candidate: "${answer}"

Your task:
1. Give brief feedback on their answer (2 sentences, constructive)
2. Score their answer out of 10
3. Ask the next interview question (make it progressively deeper based on their answers)

Respond ONLY with valid JSON:
{
  "feedback": "[2 sentence feedback]",
  "feedbackDetail": "[more detailed feedback]",
  "score": [integer 1-10],
  "nextQuestion": "[next interview question]"
}`

      const result = await model.generateContent(prompt)
      const raw = result.response.text().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(raw)
      return NextResponse.json(parsed)
    }

    if (action === 'finish') {
      const historyText = (history || []).map((m: any) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')

      const prompt = `You are wrapping up an interview for ${jobTitle}.

Conversation:
${historyText}

Final answer: "${answer}"

Score this final answer and write a warm closing message thanking the candidate, giving them brief overall feedback.

Respond ONLY with valid JSON:
{
  "score": [integer 1-10],
  "feedback": "[2 sentence feedback on last answer]",
  "closingMessage": "[warm closing message with brief overall performance summary, 3-4 sentences]"
}`

      const result = await model.generateContent(prompt)
      const raw = result.response.text().replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(raw)
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    return (await require('pdf-parse')(buffer)).text
  }
  return (await require('mammoth').extractRawText({ buffer })).value
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    const jobTitle = formData.get('jobTitle') as string
    const jobDescription = formData.get('jobDescription') as string || ''

    if (!file || !userId || !jobTitle) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('scans').eq('id', userId).single()
    if (!profile || profile.scans < 5) {
      return NextResponse.json({ error: 'Need 5 scans' }, { status: 402 })
    }

    const resumeText = await extractText(file)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const jdSection = jobDescription.trim()
      ? `\nJOB DESCRIPTION:\n${jobDescription}\n\nUse the job description to make questions highly specific to what this company is looking for. Mirror their language and requirements.`
      : ''

    const prompt = `You are an expert interviewer at a top tech company. Based on the resume and job details below, generate exactly 10 interview questions that are highly tailored and realistic.

RESUME:
${resumeText}

JOB TITLE: ${jobTitle}${jdSection}

Generate a mix of:
- 3 behavioral questions (STAR format, based on candidate's actual experience)
- 3 technical/role-specific questions (based on job requirements and resume skills)
- 2 situational questions (realistic scenarios for this role)
- 1 strengths/weakness question (relevant to this job)
- 1 career goals question (connecting their background to this role)

Make questions specific — reference actual technologies, experiences, or requirements from the resume and JD. Do NOT generate generic questions.

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {"question": "Tell me about a time you...", "category": "Behavioral", "difficulty": "Medium"},
    {"question": "...", "category": "Technical", "difficulty": "Hard"}
  ]
}
Difficulty must be exactly "Easy", "Medium", or "Hard".`

    const result = await model.generateContent(prompt)
    let raw = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)

    await supabase.from('profiles').update({ scans: profile.scans - 5 }).eq('id', userId)
    await supabase.from('scan_logs').insert({
      user_id: userId, action_type: 'interview_prep', scans_used: 5, created_at: new Date().toISOString()
    })

    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

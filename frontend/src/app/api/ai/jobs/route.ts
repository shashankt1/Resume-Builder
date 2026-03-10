import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') return (await require('pdf-parse')(buffer)).text
  return (await require('mammoth').extractRawText({ buffer })).value
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    if (!file || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = await createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('scans').eq('id', userId).single()
    if (!profile || profile.scans < 1) return NextResponse.json({ error: 'Need 1 scan' }, { status: 402 })

    const resumeText = await extractText(file)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a career counselor AI. Analyze this resume and provide comprehensive career guidance.

RESUME:
${resumeText}

Respond ONLY with valid JSON in this exact format (no extra text):
{
  "currentLevel": "Junior/Mid/Senior/Executive",
  "summary": "2-sentence career overview",
  "jobRoles": [
    {"title": "Role Title", "matchPercent": 92, "reason": "why this fits", "salaryRange": "₹8-15 LPA"},
    {"title": "Role Title", "matchPercent": 85, "reason": "why this fits", "salaryRange": "₹10-18 LPA"},
    {"title": "Role Title", "matchPercent": 78, "reason": "why this fits", "salaryRange": "₹12-20 LPA"},
    {"title": "Role Title", "matchPercent": 70, "reason": "why this fits", "salaryRange": "₹15-25 LPA"}
  ],
  "careerSwitch": {
    "from": "current domain",
    "to": "suggested new domain with high demand",
    "timeframe": "6-12 months",
    "steps": ["step 1", "step 2", "step 3", "step 4", "step 5"]
  },
  "freelancePaths": [
    {
      "platform": "Upwork",
      "url": "https://www.upwork.com",
      "niche": "specific freelance niche based on skills",
      "howToStart": ["step 1", "step 2", "step 3"],
      "earnings": "₹2,000-8,000/hour"
    },
    {
      "platform": "Fiverr",
      "url": "https://www.fiverr.com",
      "niche": "another specific niche",
      "howToStart": ["step 1", "step 2", "step 3"],
      "earnings": "$50-200/project"
    }
  ],
  "courses": [
    {"name": "Course Name", "provider": "Coursera/Udemy/YouTube/etc", "url": "https://coursera.org/...", "free": false},
    {"name": "Course Name", "provider": "YouTube", "url": "https://youtube.com/...", "free": true},
    {"name": "Course Name", "provider": "Provider", "url": "https://...", "free": false},
    {"name": "Course Name", "provider": "Provider", "url": "https://...", "free": true}
  ],
  "certifications": ["Cert 1", "Cert 2", "Cert 3", "Cert 4", "Cert 5"],
  "dsaTopics": ["Arrays", "Dynamic Programming", "Graphs", "Trees", "System Design"]
}

Note: dsaTopics should be null if the person is not in a technical/software role. Use Indian salary ranges (LPA) for Indian profiles. Use real course URLs from Coursera, Udemy, freeCodeCamp, or YouTube.`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)

    await supabase.from('profiles').update({ scans: profile.scans - 1 }).eq('id', userId)
    await supabase.from('scan_logs').insert({ user_id: userId, action_type: 'job_suggester', scans_used: 1, created_at: new Date().toISOString() })

    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

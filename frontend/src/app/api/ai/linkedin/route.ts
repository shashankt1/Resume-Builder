import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { profileText, userId } = await request.json()
    if (!profileText || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const supabase = await createAdminClient()
    const { data: profile } = await supabase.from('profiles').select('scans').eq('id', userId).single()
    if (!profile || profile.scans < 2) return NextResponse.json({ error: 'Need 2 scans' }, { status: 402 })

    const apiKey = process.env.GEMINI_API_KEY!
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a LinkedIn profile optimization expert. Analyze this LinkedIn profile content and provide detailed scoring and suggestions.

PROFILE CONTENT:
${profileText}

Respond ONLY with valid JSON in this exact format:
{
  "overallScore": [integer 0-100],
  "summary": "[2 sentence overall assessment]",
  "sectionScores": [
    {"section": "Headline", "score": [0-100], "current": "[what they have]", "suggestion": "[specific improvement]"},
    {"section": "About/Summary", "score": [0-100], "current": "[what they have]", "suggestion": "[specific improvement]"},
    {"section": "Experience", "score": [0-100], "current": "[what they have]", "suggestion": "[specific improvement]"},
    {"section": "Skills", "score": [0-100], "current": "[assessment]", "suggestion": "[specific improvement]"},
    {"section": "Keywords & SEO", "score": [0-100], "current": "[assessment]", "suggestion": "[specific improvement]"}
  ],
  "topFixes": ["[fix 1]", "[fix 2]", "[fix 3]", "[fix 4]", "[fix 5]"],
  "keywordsMissing": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)

    await supabase.from('profiles').update({ scans: profile.scans - 2 }).eq('id', userId)
    await supabase.from('scan_logs').insert({ user_id: userId, action_type: 'linkedin_analyzer', scans_used: 2, created_at: new Date().toISOString() })

    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

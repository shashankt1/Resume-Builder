import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse')
    const parsed = await pdfParse(buffer)
    return parsed.text
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: profile, error: fetchError } = await supabase
      .from('profiles').select('scans').eq('id', userId).single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (profile.scans < 1) {
      return NextResponse.json({ error: 'Not enough scans' }, { status: 402 })
    }

    const resumeText = await extractTextFromFile(file)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are the world's toughest and most thorough ATS resume analyzer. Your job is to leave nothing untouched. Analyze every single aspect of this resume with the highest standards used by top companies like Google, Amazon, Microsoft, and McKinsey.

RESUME TEXT:
${resumeText}

Be ruthlessly thorough. Check everything:
- Keyword density and ATS parsing
- Action verbs and impact language  
- Quantifiable achievements (numbers, %, $)
- Format and structure
- Skills alignment
- Grammar and clarity
- Section completeness
- Industry-specific requirements
- Seniority signals
- Recruiter 6-second scan test

Respond ONLY with valid JSON in this exact format:

{
  "score": [integer 0-100, be honest and tough - most resumes score 45-75],
  "detectedField": "[primary career field e.g. Software Engineering, Marketing, Finance]",
  "experienceYears": [estimated years as integer],
  "strengthStatement": "[one sentence validating their background before showing gaps - mention their field and experience]",
  "realWorldContext": "[2-3 sentences explaining what this score means in job market reality - which companies filter them in/out, what recruiters actually see]",
  "summary": "[2 sentence overall assessment]",
  "projectedScore": [score + 18-28 after fixes, max 97],
  "scorePercentile": [what percentile they're in, e.g. 62 means top 38%],
  "keywordMatches": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"],
  "missingKeywords": ["gap1", "gap2", "gap3", "gap4", "gap5", "gap6", "gap7", "gap8"],
  "strengths": [
    "specific strength 1 with detail",
    "specific strength 2 with detail", 
    "specific strength 3 with detail",
    "specific strength 4 with detail"
  ],
  "improvements": [
    "specific improvement 1",
    "specific improvement 2",
    "specific improvement 3",
    "specific improvement 4",
    "specific improvement 5"
  ],
  "opportunities": [
    {
      "icon": "🎯",
      "title": "Keyword Alignment",
      "whatsHappening": "Your resume and ATS systems are speaking slightly different languages. Specific keywords that trigger shortlisting are absent.",
      "theFix": "[specific fix with exact keywords to add]",
      "impact": [10-15],
      "proOnly": false
    },
    {
      "icon": "📐",
      "title": "Structure Optimization",
      "whatsHappening": "[specific structural issue found in THIS resume]",
      "theFix": "[specific fix]",
      "impact": [8-12],
      "proOnly": false
    },
    {
      "icon": "✨",
      "title": "Impact Language",
      "whatsHappening": "Your experience describes tasks rather than achievements. ATS and recruiters both rank achievement-focused resumes significantly higher.",
      "theFix": "[give 1-2 specific bullet rewrites as examples]",
      "impact": [10-15],
      "proOnly": false
    },
    {
      "icon": "📊",
      "title": "Quantification Gap",
      "whatsHappening": "[specific missing metrics in this resume]",
      "theFix": "[specific examples of how to add numbers]",
      "impact": [8-12],
      "proOnly": true
    },
    {
      "icon": "🔧",
      "title": "Technical Skills Section",
      "whatsHappening": "[specific skills gap or formatting issue]",
      "theFix": "[specific fix]",
      "impact": [5-10],
      "proOnly": true
    }
  ]
}`

    const result = await model.generateContent(prompt)
    let raw = result.response.text().replace(/```json|```/g, '').trim()

    // Strip any markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) raw = jsonMatch[0]

    const parsed = JSON.parse(raw)

    // Deduct scan
    await supabase.from('profiles').update({ scans: profile.scans - 1 }).eq('id', userId)
    await supabase.from('scan_logs').insert({
      user_id: userId,
      action_type: 'ats_analysis',
      scans_used: 1,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

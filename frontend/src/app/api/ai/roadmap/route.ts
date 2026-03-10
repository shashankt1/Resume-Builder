import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { userId, detectedField, targetGoal, score } = await request.json()

    if (!userId || !targetGoal) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are a career counselor building a highly specific, actionable career roadmap for someone.

Current field: ${detectedField || 'unknown'}
Target goal: ${targetGoal}
Current ATS score: ${score}/100
Context: Indian job market, use Indian salary ranges in LPA (Lakhs Per Annum)

Build a realistic, step-by-step roadmap to get them from where they are to their target goal.

Rules:
- Steps must be concrete and specific (not generic advice)
- Include real resources with real URLs (Coursera, YouTube, freeCodeCamp, LeetCode, etc.)
- Mix free and paid resources - prioritize free where possible
- Timeline must be realistic (not too fast, not too slow)
- DSA topics only if the target is technical/software role, otherwise null
- Salary jump should be realistic for Indian market

Respond ONLY with valid JSON:
{
  "currentGoal": "${detectedField || 'Current Role'}",
  "targetGoal": "${targetGoal}",
  "timeframe": "X-Y months",
  "salaryJump": "₹XL → ₹YL LPA (realistic range)",
  "steps": [
    {
      "week": "Week 1-2",
      "action": "Specific action to take",
      "resource": "Resource Name",
      "resourceUrl": "https://actual-url.com",
      "free": true
    },
    {
      "week": "Week 3-4",
      "action": "Next specific action",
      "resource": "Resource Name",
      "resourceUrl": "https://actual-url.com",
      "free": false
    },
    {
      "week": "Month 2",
      "action": "Action",
      "resource": "Resource",
      "resourceUrl": "https://url.com",
      "free": true
    },
    {
      "week": "Month 3",
      "action": "Action",
      "resource": "Resource",
      "resourceUrl": "https://url.com",
      "free": true
    },
    {
      "week": "Month 4-5",
      "action": "Build portfolio project in target domain",
      "resource": "GitHub",
      "resourceUrl": "https://github.com",
      "free": true
    },
    {
      "week": "Month 5-6",
      "action": "Apply to target roles + network actively",
      "resource": "LinkedIn Jobs",
      "resourceUrl": "https://linkedin.com/jobs",
      "free": true
    }
  ],
  "certifications": [
    "Certification 1 relevant to ${targetGoal}",
    "Certification 2",
    "Certification 3",
    "Certification 4"
  ],
  "dsaTopics": ["Arrays", "Strings", "Dynamic Programming", "Trees", "Graphs", "System Design", "SQL"]
}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().replace(/```json|```/g, '').trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)

    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Roadmap generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

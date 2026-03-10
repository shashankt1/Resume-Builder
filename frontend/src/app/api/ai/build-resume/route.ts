import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    if (task === 'summary') {
      const { data } = body
      const prompt = `You are an expert resume writer. Write a powerful 3-sentence professional summary for this person.

Name: ${data.name}
Current/Recent Role: ${data.workExp?.[0]?.role || 'Not specified'}
Companies: ${data.workExp?.map((w: any) => w.company).join(', ') || 'Not specified'}
Skills: ${data.skills?.join(', ') || 'Not specified'}
Education: ${data.education?.[0]?.degree || ''} from ${data.education?.[0]?.institution || ''}

Rules:
- Start with their role/expertise, not "I" or their name
- Include years of experience if available
- Mention 2-3 key technologies/skills
- End with a value statement (what they bring to a team)
- No buzzwords like "passionate" or "hardworking"
- ATS-optimized language
- Max 60 words

Respond with ONLY the summary text, no quotes, no labels.`

      const result = await model.generateContent(prompt)
      return NextResponse.json({ result: result.response.text().trim() })
    }

    if (task === 'bullets') {
      const { company, role, bullets } = body
      const prompt = `You are an expert resume writer. Rewrite these job bullets to be ATS-optimized, impact-focused, and quantified.

Company: ${company}
Role: ${role}
Current bullets:
${bullets.map((b: string, i: number) => `${i + 1}. ${b || '(empty)'}`).join('\n')}

Rules:
- Start every bullet with a strong action verb (Built, Led, Increased, Reduced, Designed, Deployed)
- Add realistic numbers/metrics where logical (%, users, $, time saved, team size)
- Make it ATS-friendly — include relevant technical terms
- Keep each bullet under 20 words
- Remove filler words
- If a bullet is empty, write a strong generic one for this role

Respond ONLY with valid JSON array of strings, same count as input:
["bullet 1", "bullet 2", "bullet 3"]`

      const result = await model.generateContent(prompt)
      let raw = result.response.text().replace(/```json|```/g, '').trim()
      const match = raw.match(/\[[\s\S]*\]/)
      const parsed = JSON.parse(match ? match[0] : raw)
      return NextResponse.json({ result: parsed })
    }

    return NextResponse.json({ error: 'Unknown task' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

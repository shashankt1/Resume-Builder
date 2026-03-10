import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { question, answer, jobTitle } = await request.json()
    if (!question || !answer) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY!
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are an expert interviewer evaluating a candidate's answer for a ${jobTitle || 'professional'} role.

QUESTION: ${question}
CANDIDATE'S ANSWER: ${answer}

Evaluate and respond ONLY with valid JSON:
{
  "score": [integer 1-10],
  "feedback": "[2-3 sentences of specific constructive feedback]",
  "betterAnswer": "[A concise model answer in 3-4 sentences showing what a great response looks like]"
}`

    const result = await model.generateContent(prompt)
    const raw = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}

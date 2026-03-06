import { NextRequest, NextResponse } from 'next/server'
import { generateInterviewQuestions } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobTitle, jobDescription, resumeText, count = 10, userId } = body

    if (!jobTitle || !resumeText) {
      return NextResponse.json(
        { error: 'Job title and resume text are required' },
        { status: 400 }
      )
    }

    // Optional: Check user credits
    if (userId) {
      const supabase = await createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (profile && profile.credits < 2) {
        return NextResponse.json(
          { error: 'Insufficient credits. Interview questions require 2 credits.' },
          { status: 402 }
        )
      }

      // Deduct credits
      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 2 })
          .eq('id', userId)
      }
    }

    const questions = await generateInterviewQuestions(
      jobTitle,
      jobDescription || '',
      resumeText,
      count
    )

    return NextResponse.json(questions)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate questions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

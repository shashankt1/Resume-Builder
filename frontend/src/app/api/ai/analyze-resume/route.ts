import { NextRequest, NextResponse } from 'next/server'
import { analyzeResume } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, userId } = body

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
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

      if (profile && profile.credits < 1) {
        return NextResponse.json(
          { error: 'Insufficient credits. Please purchase more credits.' },
          { status: 402 }
        )
      }

      // Deduct credit
      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 1 })
          .eq('id', userId)
      }
    }

    const analysis = await analyzeResume(resumeText)

    return NextResponse.json(analysis)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

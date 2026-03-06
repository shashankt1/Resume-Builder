import { NextRequest, NextResponse } from 'next/server'
import { analyzeResumeATS } from '@/lib/ai/gemini'
import { createAdminClient } from '@/lib/supabase/server'
import { SCAN_COSTS } from '@/lib/plans'

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse')
    const parsed = await pdfParse(buffer)
    return parsed.text
  }

  if (
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error('Unsupported file type. Please upload a PDF or DOCX file.')
}

export async function POST(request: NextRequest) {
  try {
    // Support both FormData (file upload) and JSON (plain text fallback)
    let resumeText = ''
    let userId = ''

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      userId = (formData.get('userId') as string) || ''

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
      }

      resumeText = await extractTextFromFile(file)
    } else {
      const body = await request.json()
      resumeText = body.resumeText || ''
      userId = body.userId || ''
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the file. Please try a different file.' },
        { status: 400 }
      )
    }

    // Check and deduct scans
    if (userId) {
      const supabase = await createAdminClient()

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('scans')
        .eq('id', userId)
        .single()

      if (fetchError || !profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (profile.scans < SCAN_COSTS.ats_analysis) {
        return NextResponse.json(
          { error: 'Insufficient scans. Please upgrade.' },
          { status: 402 }
        )
      }

      // Try RPC first, fall back to direct update
      const { error: rpcError } = await supabase.rpc('deduct_scan', {
        p_user_id: userId,
        p_amount: SCAN_COSTS.ats_analysis,
      })

      if (rpcError) {
        const newScans = profile.scans - SCAN_COSTS.ats_analysis
        await supabase
          .from('profiles')
          .update({ scans: newScans })
          .eq('id', userId)
      }

      // Log usage
      await supabase.from('scan_logs').insert({
        user_id: userId,
        action_type: 'ats_analysis',
        scans_used: SCAN_COSTS.ats_analysis,
        created_at: new Date().toISOString(),
      })
    }

    const analysis = await analyzeResumeATS(resumeText)
    return NextResponse.json(analysis)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

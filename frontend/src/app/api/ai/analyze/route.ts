import { NextRequest, NextResponse } from 'next/server'
import { analyzeResumeATS } from '@/lib/ai/gemini'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SCAN_COSTS } from '@/lib/plans'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeText, userId } = body

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 })
    }

    // Check and deduct scans if userId provided
    if (userId) {
      const supabase = await createAdminClient()
      
      // Get current scans
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('scans')
        .eq('id', userId)
        .single()

      if (fetchError || !profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (profile.scans < SCAN_COSTS.ats_analysis) {
        return NextResponse.json({ error: 'Insufficient scans. Please upgrade.' }, { status: 402 })
      }

      // Deduct scans atomically - try RPC first
      const { error: rpcError } = await supabase.rpc('deduct_scan', {
        p_user_id: userId,
        p_amount: SCAN_COSTS.ats_analysis,
      })

      if (rpcError) {
        // Fallback to direct update
        const newScans = profile.scans - SCAN_COSTS.ats_analysis
        if (newScans < 0) {
          return NextResponse.json({ error: 'Insufficient scans' }, { status: 402 })
        }
        
        await supabase
          .from('profiles')
          .update({ scans: newScans })
          .eq('id', userId)
      }

      // Log scan usage
      await supabase.from('scan_logs').insert({
        user_id: userId,
        action_type: 'ats_analysis',
        scans_used: SCAN_COSTS.ats_analysis,
        created_at: new Date().toISOString(),
      })
    }

    // Perform analysis
    const analysis = await analyzeResumeATS(resumeText)

    return NextResponse.json(analysis)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, actionType } = body

    if (!userId || !amount || !actionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    if (profile.scans < amount) {
      return NextResponse.json({ error: 'Insufficient scans', currentScans: profile.scans }, { status: 402 })
    }

    // Deduct scans (never go negative)
    const newScans = Math.max(0, profile.scans - amount)
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ scans: newScans })
      .eq('id', userId)
      .gte('scans', amount) // Only update if enough scans

    if (updateError) {
      return NextResponse.json({ error: 'Failed to deduct scans' }, { status: 500 })
    }

    // Log the action
    await supabase.from('scan_logs').insert({
      user_id: userId,
      action_type: actionType,
      scans_used: amount,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      remainingScans: newScans,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deduct scans'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

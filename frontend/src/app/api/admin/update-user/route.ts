import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, scanAdjust, plan } = await request.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const supabase = await createAdminClient()
    const updates: Record<string, any> = {}

    if (plan) updates.plan = plan

    if (scanAdjust !== undefined && scanAdjust !== null && !isNaN(scanAdjust)) {
      // Get current scans
      const { data: profile } = await supabase
        .from('profiles')
        .select('scans')
        .eq('id', userId)
        .single()

      if (profile) {
        const newScans = Math.max(0, profile.scans + scanAdjust)
        updates.scans = newScans
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

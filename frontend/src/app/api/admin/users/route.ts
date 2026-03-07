import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, plan, scans, created_at, resume_updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get auth users for emails
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    authUsers.forEach(u => { if (u.email) emailMap[u.id] = u.email })

    const users = (profiles || []).map(p => ({
      ...p,
      email: emailMap[p.id] || undefined,
    }))

    // Stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: scansToday } = await supabase
      .from('scan_logs')
      .select('scans_used')
      .gte('created_at', today.toISOString())

    const totalScansToday = (scansToday || []).reduce((sum, s) => sum + (s.scans_used || 0), 0)

    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('amount')

    const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)

    return NextResponse.json({
      users,
      stats: {
        totalUsers: users.length,
        totalScansToday,
        totalRevenue,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

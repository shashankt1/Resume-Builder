'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Users, Zap, Search, Sun, Moon, DollarSign, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import Link from 'next/link'

interface UserProfile {
  id: string
  email?: string
  plan: string
  scans: number
  created_at: string
  resume_updated_at: string | null
}

interface Stats {
  totalUsers: number
  totalScansToday: number
  totalRevenue: number
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalScansToday: 0, totalRevenue: 0 })
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [scanAdjust, setScanAdjust] = useState('')
  const [newPlan, setNewPlan] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      // Check admin via API
      const res = await fetch('/api/admin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (!res.ok) { router.push('/dashboard'); return }

      setAuthorized(true)
      await loadData()
      setLoading(false)
    }
    init()
  }, [])

  const loadData = async () => {
    const res = await fetch('/api/admin/users')
    if (!res.ok) return
    const data = await res.json()
    setUsers(data.users || [])
    setFilteredUsers(data.users || [])
    setStats(data.stats || { totalUsers: 0, totalScansToday: 0, totalRevenue: 0 })
  }

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users)
    } else {
      setFilteredUsers(users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.id.includes(search)
      ))
    }
  }, [search, users])

  const saveUserChanges = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      const body: any = { userId: selectedUser.id }
      if (scanAdjust !== '') body.scanAdjust = parseInt(scanAdjust)
      if (newPlan !== '') body.plan = newPlan

      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Update failed')

      toast.success('User updated successfully')
      setScanAdjust('')
      setNewPlan('')
      setSelectedUser(null)
      await loadData()
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-slate-100 text-slate-700',
      starter: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700',
    }
    return colors[plan] || 'bg-slate-100 text-slate-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">CraftlyCV</span>
            </Link>
            <Badge className="bg-red-100 text-red-700 border-red-200">Admin</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" /> Admin Panel
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-5 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalScansToday}</p>
                <p className="text-sm text-muted-foreground">Scans Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Users Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> All Users
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => { setSelectedUser(user); setNewPlan(user.plan); setScanAdjust('') }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-blue-300 ${selectedUser?.id === user.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-transparent bg-slate-50 dark:bg-slate-800/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.email || user.id.slice(0, 16) + '...'}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPlanColor(user.plan)}`}>
                            {user.plan}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />{user.scans}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs text-muted-foreground">Selected user</p>
                      <p className="font-medium text-sm truncate mt-1">{selectedUser.email || selectedUser.id}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPlanColor(selectedUser.plan)}`}>
                          {selectedUser.plan}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 inline mr-1" />{selectedUser.scans} scans
                        </span>
                      </div>
                    </div>

                    {/* Adjust scans */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Add / Remove Scans
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 10 or -5"
                        value={scanAdjust}
                        onChange={(e) => setScanAdjust(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use negative number to deduct. Current: {selectedUser.scans}
                        {scanAdjust !== '' && !isNaN(parseInt(scanAdjust)) && (
                          <> → <strong>{Math.max(0, selectedUser.scans + parseInt(scanAdjust))}</strong></>
                        )}
                      </p>
                    </div>

                    {/* Change plan */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Change Plan</label>
                      <Select value={newPlan} onValueChange={setNewPlan}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={saveUserChanges}
                      disabled={saving || (scanAdjust === '' && newPlan === selectedUser.plan)}
                      className="w-full"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => { setSelectedUser(null); setScanAdjust(''); setNewPlan('') }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Click a user to edit their plan or scans</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

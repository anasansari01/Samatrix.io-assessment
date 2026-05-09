'use client'
import { useState, useEffect } from 'react'

interface Stats {
  totalUsers: number
  totalProjects: number
  totalTasks: number
  activeProjects: number
  doneTasks: number
  inProgressTasks: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    loadUsers()
  }, [])

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data.data?.stats)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStats(false)
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.data?.users || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  async function changeRole(userId: string, newRole: string) {
    setChangingRole(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setChangingRole(null)
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Delete this user? All their projects and tasks will be deleted too.')) return

    setDeletingUser(userId)
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        loadStats()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingUser(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Admin Panel</h1>
        <p className="text-slate-500 text-sm mt-1">Manage users and view system stats</p>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 h-20" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} color="bg-blue-50 border-blue-200 text-blue-800" />
          <StatCard label="Total Projects" value={stats.totalProjects} color="bg-purple-50 border-purple-200 text-purple-800" />
          <StatCard label="Total Tasks" value={stats.totalTasks} color="bg-slate-50 border-slate-200 text-slate-800" />
          <StatCard label="Active Projects" value={stats.activeProjects} color="bg-green-50 border-green-200 text-green-800" />
          <StatCard label="In Progress" value={stats.inProgressTasks} color="bg-yellow-50 border-yellow-200 text-yellow-800" />
          <StatCard label="Completed Tasks" value={stats.doneTasks} color="bg-emerald-50 border-emerald-200 text-emerald-800" />
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">All Users</h2>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} users registered</p>
        </div>

        {loadingUsers ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          disabled={changingRole === user.id}
                          onClick={() => changeRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          className="text-xs border border-slate-300 px-2 py-1 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          {changingRole === user.id ? '...' : user.role === 'admin' ? 'Make User' : 'Make Admin'}
                        </button>
                        <button
                          disabled={deletingUser === user.id}
                          onClick={() => deleteUser(user.id)}
                          className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deletingUser === user.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`border rounded-xl p-4 ${color}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-75">{label}</p>
    </div>
  )
}

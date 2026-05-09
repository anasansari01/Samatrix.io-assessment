import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/auth/login')

  const userFromDb = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
  }).from(users).where(eq(users.id, currentUser.id))

  if (userFromDb.length === 0) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={userFromDb[0]} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

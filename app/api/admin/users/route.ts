import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users, projects, tasks } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)
    if (currentUser.role !== 'admin') return errorResponse('Admin only', 403)

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users)

    return successResponse({ users: allUsers })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)
    if (currentUser.role !== 'admin') return errorResponse('Admin only', 403)

    const body = await req.json()
    const { userId, role } = body

    if (!userId || !role) return errorResponse('userId and role required')
    if (!['admin', 'user'].includes(role)) return errorResponse('Invalid role')

    if (userId === currentUser.id) return errorResponse('Cannot change your own role')

    const updated = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning()

    return successResponse({ user: updated[0] })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)
    if (currentUser.role !== 'admin') return errorResponse('Admin only', 403)

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return errorResponse('userId required')
    if (userId === currentUser.id) return errorResponse('Cannot delete yourself')

    await db.update(tasks).set({ assignedTo: null }).where(eq(tasks.assignedTo, userId))
    const userProjects = await db.select().from(projects).where(eq(projects.ownerId, userId))
    for (const p of userProjects) {
      await db.delete(tasks).where(eq(tasks.projectId, p.id))
    }
    await db.delete(projects).where(eq(projects.ownerId, userId))
    await db.delete(users).where(eq(users.id, userId))

    return successResponse({ message: 'User deleted' })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

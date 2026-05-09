import { db } from '@/db'
import { users, projects, tasks } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq, count } from 'drizzle-orm'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)
    if (currentUser.role !== 'admin') return errorResponse('Admin only', 403)

    const totalUsers = await db.select({ count: count() }).from(users)
    const totalProjects = await db.select({ count: count() }).from(projects)
    const totalTasks = await db.select({ count: count() }).from(tasks)

    const activeProjCount = await db.select({ count: count() }).from(projects).where(eq(projects.status, 'active'))
    const doneTasks = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'done'))
    const inProgressTasks = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'in_progress'))

    return successResponse({
      stats: {
        totalUsers: totalUsers[0].count,
        totalProjects: totalProjects[0].count,
        totalTasks: totalTasks[0].count,
        activeProjects: activeProjCount[0].count,
        doneTasks: doneTasks[0].count,
        inProgressTasks: inProgressTasks[0].count,
      }
    })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

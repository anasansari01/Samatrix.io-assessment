import { NextRequest } from 'next/server'
import { db } from '@/db'
import { tasks, projects } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const body = await req.json()
    const { title, description, priority, projectId, assignedTo, status } = body

    if (!title || title.trim() === '') {
      return errorResponse('Task title is required')
    }

    if (!projectId) {
      return errorResponse('Project ID is required')
    }

    const project = await db.select().from(projects).where(eq(projects.id, projectId))
    if (project.length === 0) return errorResponse('Project not found', 404)

    if (currentUser.role !== 'admin' && project[0].ownerId !== currentUser.id) {
      return errorResponse('Forbidden', 403)
    }

    const newTask = await db.insert(tasks).values({
      title: title.trim(),
      description: description || null,
      priority: priority || 'medium',
      status: status || 'todo',
      projectId,
      assignedTo: assignedTo || null,
    }).returning()

    return successResponse({ task: newTask[0] }, 201)
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

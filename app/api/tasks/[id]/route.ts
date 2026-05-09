import { NextRequest } from 'next/server'
import { db } from '@/db'
import { tasks, projects } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const task = await db.select().from(tasks).where(eq(tasks.id, params.id))
    if (task.length === 0) return errorResponse('Task not found', 404)

    const project = await db.select().from(projects).where(eq(projects.id, task[0].projectId))
    if (currentUser.role !== 'admin' && project[0].ownerId !== currentUser.id) {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const { title, description, status, priority, assignedTo } = body

    if (!title || title.trim() === '') {
      return errorResponse('Task title is required')
    }

    const updated = await db.update(tasks)
      .set({
        title: title.trim(),
        description: description || null,
        status: status || task[0].status,
        priority: priority || task[0].priority,
        assignedTo: assignedTo || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, params.id))
      .returning()

    return successResponse({ task: updated[0] })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const task = await db.select().from(tasks).where(eq(tasks.id, params.id))
    if (task.length === 0) return errorResponse('Task not found', 404)

    const project = await db.select().from(projects).where(eq(projects.id, task[0].projectId))
    if (currentUser.role !== 'admin' && project[0].ownerId !== currentUser.id) {
      return errorResponse('Forbidden', 403)
    }

    await db.delete(tasks).where(eq(tasks.id, params.id))

    return successResponse({ message: 'Task deleted' })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

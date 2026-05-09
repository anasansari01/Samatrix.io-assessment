import { NextRequest } from 'next/server'
import { db } from '@/db'
import { projects, tasks, users } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }:{ params: Promise<{ id: string }> }) {
  try {
    const currentUser = await  getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const project = await db.select().from(projects).where(eq(projects.id, (await params).id))
    if (project.length === 0) return errorResponse('Project not found', 404)

    if (currentUser.role !== 'admin' && project[0].ownerId !== currentUser.id) {
      return errorResponse('Forbidden', 403)
    }

    const projectTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectId: tasks.projectId,
        assignedTo: tasks.assignedTo,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: users.name,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.projectId, (await params).id))

    return successResponse({ project: project[0], tasks: projectTasks })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

export async function PUT(req: NextRequest, { params }:{ params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const project = await db.select().from(projects).where(eq(projects.id, (await params).id))
    if (project.length === 0) return errorResponse('Project not found', 404)

    if (currentUser.role !== 'admin' && project[0].ownerId !== currentUser.id) {
      return errorResponse('Forbidden', 403)
    }

    const body = await req.json()
    const { name, description, status } = body

    if (!name || name.trim() === '') {
      return errorResponse('Project name is required')
    }

    const updated = await db.update(projects)
      .set({
        name: name.trim(),
        description: description || null,
        status: status || project[0].status,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, (await params).id))
      .returning()

    return successResponse({ project: updated[0] })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

export async function DELETE(req: NextRequest, { params }:{ params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const project = await db.select().from(projects).where(eq(projects.id, (await params).id))
    if (project.length === 0) return errorResponse('Project not found', 404)

    if (currentUser.role !== 'admin' && project[0].ownerId !== currentUser.id) {
      return errorResponse('Forbidden', 403)
    }

    await db.delete(tasks).where(eq(tasks.projectId, (await params).id))
    await db.delete(projects).where(eq(projects.id, (await params).id))

    return successResponse({ message: 'Project deleted' })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

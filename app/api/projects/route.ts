import { NextRequest } from 'next/server'
import { db } from '@/db'
import { projects, users } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    let allProjects

    if (currentUser.role === 'admin') {
      allProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          ownerId: projects.ownerId,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          ownerName: users.name,
          ownerEmail: users.email,
        })
        .from(projects)
        .leftJoin(users, eq(projects.ownerId, users.id))
    } else {
      allProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          ownerId: projects.ownerId,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
          ownerName: users.name,
          ownerEmail: users.email,
        })
        .from(projects)
        .leftJoin(users, eq(projects.ownerId, users.id))
        .where(eq(projects.ownerId, currentUser.id))
    }

    return successResponse({ projects: allProjects })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const body = await req.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return errorResponse('Project name is required')
    }

    const newProject = await db.insert(projects).values({
      name: name.trim(),
      description: description || null,
      ownerId: currentUser.id,
      status: 'active',
    }).returning()

    return successResponse({ project: newProject[0] }, 201)
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

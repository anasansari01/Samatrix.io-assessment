import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Not authenticated', 401)
    }

    const found = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, user.id))

    if (found.length === 0) {
      return errorResponse('User not found', 404)
    }

    return successResponse({ user: found[0] })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

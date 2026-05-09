import { db } from '@/db'
import { users } from '@/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return errorResponse('Not authenticated', 401)

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
    }).from(users)

    return successResponse({ users: allUsers })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

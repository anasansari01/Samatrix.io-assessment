import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { comparePassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse('Email and password required')
    }

    const found = await db.select().from(users).where(eq(users.email, email))
    if (found.length === 0) {
      return errorResponse('Invalid credentials', 401)
    }

    const user = found[0]
    const isValid = comparePassword(password, user.password)
    if (!isValid) {
      return errorResponse('Invalid credentials', 401)
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return successResponse({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

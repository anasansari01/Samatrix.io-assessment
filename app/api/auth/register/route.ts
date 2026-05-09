import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { hashPassword, signToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/response'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return errorResponse('All fields are required')
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters')
    }

    const existing = await db.select().from(users).where(eq(users.email, email))
    if (existing.length > 0) {
      return errorResponse('Email already in use')
    }

    const hashed = hashPassword(password)

    const newUser = await db.insert(users).values({
      name,
      email,
      password: hashed,
      role: 'user',
    }).returning()

    const user = newUser[0]
    const token = signToken({ id: user.id, email: user.email, role: user.role })

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return successResponse({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, 201)
  } catch (err) {
    console.error(err)
    return errorResponse('Something went wrong', 500)
  }
}

import { cookies } from 'next/headers'
import { successResponse } from '@/lib/response'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  return successResponse({ message: 'Logged out' })
}

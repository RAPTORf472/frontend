import { cookies } from 'next/headers'

export async function getToken(): Promise<string | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('token')
  return token?.value || localStorage.getItem('token')
} 
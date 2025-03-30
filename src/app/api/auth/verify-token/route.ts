import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const headers = new Headers(request.headers)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers.get('Authorization') || '',
      },
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Token verification failed',
        error: data.error
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('Token verification API Error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
} 

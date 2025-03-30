import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { route: string[] } }) {
  const route = params.route.join('/')
  const body = await request.json().catch(() => ({}))
  const headers = new Headers(request.headers)
  
  // Validate required fields for login
  if (route === 'login') {
    if (!body.email || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 })
    }
  }
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': headers.get('Authorization') || '',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    if (!response.ok) {
      // Handle specific error cases for login
      if (route === 'login' && response.status === 401) {
        return NextResponse.json({
          success: false,
          message: 'Invalid email or password'
        }, { status: 401 })
      }

      return NextResponse.json({
        success: false,
        message: data.message || 'Authentication failed',
        error: data.error
      }, { status: response.status })
    }

    // For successful login, validate the response data
    if (route === 'login' && (!data.token || !data.user)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid server response',
        error: 'INVALID_RESPONSE'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error: any) {
    console.error(`Auth API Error (${route}):`, {
      error: error.message,
      cause: error.cause
    })
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        message: 'Unable to connect to the authentication server. Please try again later.',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { route: string[] } }) {
  const route = params.route.join('/')
  const headers = new Headers(request.headers)
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/${route}`, {
      headers: {
        'Authorization': headers.get('Authorization') || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Authentication failed',
        error: data.error
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error: any) {
    console.error(`Auth API Error (${route}):`, {
      error: error.message,
      cause: error.cause
    })
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        message: 'Unable to connect to the authentication server. Please try again later.',
        error: 'NETWORK_ERROR'
      }, { status: 503 })
    }
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      error: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
} 


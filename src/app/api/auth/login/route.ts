import { NextResponse } from 'next/server'

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    roles: string[];
    created_at: string | null;
    last_login: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  message?: string;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Basic validation
    if (!body.email || !body.password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 })
    }
        
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
        credentials: 'include'
      })

      const data: LoginResponse = await response.json()
      
      // Handle specific error cases
      if (!response.ok) {
        switch (response.status) {
          case 400:
            return NextResponse.json({
              success: false,
              message: data.message || 'Invalid request format'
            }, { status: 400 })
          case 401:
            return NextResponse.json({
              success: false,
              message: data.message || 'Invalid email or password'
            }, { status: 401 })
          case 500:
            return NextResponse.json({
              success: false,
              message: data.message || 'Server error'
            }, { status: 500 })
          default:
            return NextResponse.json({
              success: false,
              message: data.message || 'Login failed'
            }, { status: response.status })
        }
      }

      // Validate response data
      if (!data.token || !data.user) {
        return NextResponse.json({
          success: false,
          message: 'Invalid server response format'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        token: data.token,
        user: data.user
      })
    } catch (fetchError: any) {
      console.error('Backend connection error:', {
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
        error: fetchError,
        cause: fetchError.cause
      })
      
      return NextResponse.json({
        success: false,
        message: 'Unable to connect to the server. Please make sure the backend is running.',
        error: 'ECONNREFUSED'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Login API Error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
} 


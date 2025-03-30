import { NextResponse } from 'next/server'

interface RegisterResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    roles: string[];
    created_at: string | null;
    last_login: string | null;
  };
  message?: string;
  error?: string;
  field?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Basic validation
    const requiredFields = ['username', 'email', 'password']
    for (const field of requiredFields) {
      if (!body[field]?.trim()) {
        return NextResponse.json({
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          field
        }, { status: 400 })
      }
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email format',
        field: 'email'
      }, { status: 400 })
    }

    // Username format validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(body.username)) {
      return NextResponse.json({
        success: false,
        message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores',
        field: 'username'
      }, { status: 400 })
    }

    // Password strength validation
    const passwordRegex = {
      length: /.{8,}/,
      uppercase: /[A-Z]/,
      lowercase: /[a-z]/,
      number: /[0-9]/,
      special: /[!@#$%^&*(),.?":{}|<>]/
    }

    const passwordErrors = []
    if (!passwordRegex.length.test(body.password)) {
      passwordErrors.push('be at least 8 characters long')
    }
    if (!passwordRegex.uppercase.test(body.password)) {
      passwordErrors.push('contain at least one uppercase letter')
    }
    if (!passwordRegex.lowercase.test(body.password)) {
      passwordErrors.push('contain at least one lowercase letter')
    }
    if (!passwordRegex.number.test(body.password)) {
      passwordErrors.push('contain at least one number')
    }
    if (!passwordRegex.special.test(body.password)) {
      passwordErrors.push('contain at least one special character')
    }

    if (passwordErrors.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Password must ${passwordErrors.join(', ')}`,
        field: 'password'
      }, { status: 400 })
    }
    
        
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
        credentials: 'include'
      })

      const data: RegisterResponse = await response.json()
      
      // Handle specific error cases
      if (!response.ok) {
        switch (response.status) {
          case 400:
            return NextResponse.json({
              success: false,
              message: data.message || 'Invalid request format',
              field: data.field
            }, { status: 400 })
          case 409:
            return NextResponse.json({
              success: false,
              message: data.message || 'User already exists',
              field: data.field
            }, { status: 409 })
          case 500:
            return NextResponse.json({
              success: false,
              message: data.message || 'Server error'
            }, { status: 500 })
          default:
            return NextResponse.json({
              success: false,
              message: data.message || 'Registration failed'
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
        message: data.message,
        token: data.token,
        user: data.user
      })
    } catch (fetchError: any) {
      console.error('Backend connection error:', {
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
        error: fetchError,
        cause: fetchError.cause
      })
      
      return NextResponse.json({
        success: false,
        message: 'Unable to connect to the server. Please try again later.',
        error: 'ECONNREFUSED'
      }, { status: 503 })
    }
  } catch (error) {
    console.error('Registration API Error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
} 


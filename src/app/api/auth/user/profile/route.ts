import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.warn('DEPRECATED: /api/auth/user/profile is deprecated. Please use /api/auth/me instead.')
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  console.warn('DEPRECATED: /api/auth/user/profile is deprecated. Please use /api/auth/me instead.')
  
  try {
    const body = await request.json()
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
} 
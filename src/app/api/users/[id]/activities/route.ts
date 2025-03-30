import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authentication token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '20'
    const offset = searchParams.get('offset') || '0'

    // Build backend URL with query parameters
    const queryParams = new URLSearchParams()
    queryParams.append('limit', limit)
    queryParams.append('offset', offset)
    const queryString = queryParams.toString()

    // Fetch user activities from backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${params.id}/activities?${queryString}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Disable caching
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Backend error response:', errorData)
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to fetch user activities' 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Ensure we return the expected format
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('API Error:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch user activities',
        activities: []
      },
      { status: 500 }
    )
  }
} 

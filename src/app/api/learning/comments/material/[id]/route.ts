import { NextRequest, NextResponse } from 'next/server'

// Get comments for a learning material
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '10'
    
    // Forward request to backend
    let backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${params.id}/comments`
    const queryParams = new URLSearchParams()
    queryParams.append('page', page)
    queryParams.append('per_page', perPage)
    
    const response = await fetch(`${backendUrl}?${queryParams.toString()}`, {
      cache: 'no-store' // Disable caching
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error response:', errorText)
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// Create a new comment for a learning material
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const id = params.id
    const body = await request.json()

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${id}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error response:', errorText)
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    )
  }
} 


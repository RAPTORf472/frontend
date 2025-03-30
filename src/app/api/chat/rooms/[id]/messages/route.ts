import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const per_page = searchParams.get('per_page') || '50'

    // Get the authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authorization header is required',
          messages: []
        },
        { status: 401 }
      )
    }

    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/rooms/${params.id}/messages?page=${page}&per_page=${per_page}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })

    // If we get a non-200 response, log the full response for debugging
    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      let errorDetail = ''
      
      if (contentType?.includes('application/json')) {
        const errorJson = await response.json()
        errorDetail = JSON.stringify(errorJson)
      } else {
        errorDetail = await response.text()
      }

      console.error('Error response from backend:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        errorDetail
      })

      return NextResponse.json(
        { 
          success: false,
          error: `Failed to fetch messages: ${response.statusText}`,
          messages: []
        },
        { status: response.status }
      )
    }

    // Parse the JSON response
    const data = await response.json()
    
    // Ensure we always return a consistent format
    if (Array.isArray(data)) {
      return NextResponse.json({
        success: true,
        messages: data
      })
    } else if (data.messages && Array.isArray(data.messages)) {
      return NextResponse.json({
        success: true,
        ...data
      })
    } else {
      console.error('Unexpected messages data format:', data)
      return NextResponse.json({
        success: false,
        error: 'Invalid response format from server',
        messages: []
      })
    }
  } catch (error) {
    console.error('Error in messages route:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        messages: []
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/rooms/${params.id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify(data)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 


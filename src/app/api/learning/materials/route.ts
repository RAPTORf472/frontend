import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Forward request to backend
    let backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/learning`
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (type) params.append('type', type)
    if (search) params.append('search', search)

    const queryString = params.toString()
    if (queryString) backendUrl += `?${queryString}`

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      cache: 'no-store' // Disable caching
    })

    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error response:', errorText)
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    // Ensure we return the expected format
    const result = {
      materials: Array.isArray(data) ? data : data.materials || []
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch learning materials',
        materials: []
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const id = request.url.split('/').pop()
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
      },
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Extract form data
    const data = await request.json()
    
    // Call the backend admin endpoint for creating any type of content
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/admin/materials`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const responseData = await response.json()
    
    // Return the response with appropriate status
    return NextResponse.json(responseData, { 
      status: response.ok ? 201 : response.status 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create learning material' },
      { status: 500 }
    )
  }
} 

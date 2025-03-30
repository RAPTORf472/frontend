import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const token = request.headers.get('Authorization')
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${params.id}`

    const response = await fetch(url, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to fetch learning material',
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('Learning Material API Error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

export async function PUT(
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

    // Extract form data
    const data = await request.json()
    
    // Call the backend endpoint for updating learning materials
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${params.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const responseData = await response.json()
    
    // Return the response with appropriate status
    return NextResponse.json(responseData, { 
      status: response.ok ? 200 : response.status 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update learning material' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token || '',
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


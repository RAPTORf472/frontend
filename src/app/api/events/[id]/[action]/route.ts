import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: 'register' | 'unregister' } }
) {
  const { id, action } = params
  const headers = new Headers(request.headers)
  const authHeader = headers.get('Authorization')
  
  try {
    if (!authHeader) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Authentication required'
        },
        { status: 401 }
      )
    }

    // Make the registration/unregistration request
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/events/${id}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })

    // Check content type to handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.error('Received non-JSON response:', await response.text())
      return NextResponse.json(
        { 
          success: false,
          message: 'Unexpected response from server'
        },
        { status: 500 }
      )
    }

    const data = await response.json()

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Authentication required',
            error: 'AUTH_REQUIRED'
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { 
          success: false,
          message: data.message || data.error || `Failed to ${action} for event`,
        },
        { status: response.status }
      )
    }

    // After successful registration/unregistration, fetch updated event data
    const eventResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/events/${id}`, {
      headers: {
        'Authorization': authHeader
      }
    })

    if (eventResponse.ok) {
      const eventData = await eventResponse.json()
      return NextResponse.json({
        ...data,
        success: true,
        event: eventData
      })
    } else {
      console.error('Failed to fetch updated event data:', await eventResponse.text())
    }

    // If we can't get updated event data, still return success
    return NextResponse.json({
      ...data,
      success: true
    })

  } catch (error) {
    console.error(`Error ${action}ing for event:`, error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
} 


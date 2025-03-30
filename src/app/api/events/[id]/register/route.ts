import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure we have a valid event ID
    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      )
    }

    // Ensure backend URL is configured
    if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
      throw new Error('Backend URL is not configured')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/events/${eventId}/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        }
      }
    )

    // Check content type to handle non-JSON responses
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.error('Received non-JSON response:', await response.text())
      return NextResponse.json(
        { 
          message: 'Unexpected response from server',
          success: false 
        },
        { status: 500 }
      )
    }

    const result = await response.json()

    if (!response.ok) {
      console.error('Event registration failed:', result)
      return NextResponse.json(
        { 
          message: result.message || 'Failed to register for event',
          success: false 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      ...result,
      success: true
    })
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
} 
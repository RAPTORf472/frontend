import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/rooms/unread`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        }
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching unread counts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch unread counts',
        success: false,
        unread_counts: {}
      },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notifications/unread`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        }
      }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching unread notifications:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch unread notifications',
        success: false,
        unread_count: 0 
      },
      { status: 500 }
    )
  }
} 
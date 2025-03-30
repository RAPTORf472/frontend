import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const headers = new Headers(request.headers)
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/events/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers.get('Authorization') || ''
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch categories' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Events Categories API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

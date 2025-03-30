import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let body = {}
    try {
      body = await request.json()
    } catch (e) {
      // If body parsing fails, use empty object
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/rooms/${params.id}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify(body)
      }
    )

    const responseData = await response.json()

    if (!response.ok) {
      return NextResponse.json(responseData, { status: response.status })
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 

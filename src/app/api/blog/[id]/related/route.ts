import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') || '3'
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/blog/${params.id}/related?limit=${limit}`,
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
    console.error('Error fetching related posts:', error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        posts: []
      },
      { status: 500 }
    )
  }
} 
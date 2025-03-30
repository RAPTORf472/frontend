import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')
    const url = `${baseUrl}/forum/discussions/${params.id}/replies`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      }
    })

    if (!response.ok) {
      console.error('Error response:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response body:', errorText)
      
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json(error, { status: response.status })
      } catch (e) {
        return NextResponse.json(
          { message: `Backend error: ${response.status} ${response.statusText}` },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      console.error('Invalid replies data format:', data)
      return NextResponse.json({ replies: [] })
    }

    // Transform the replies data to ensure consistent structure
    const transformedReplies = data.map(reply => ({
      id: reply.id,
      content: reply.content || '',
      author_id: reply.author_id,
      author_name: reply.author_name || 'Unknown',
      likes_count: reply.likes_count || 0,
      created_at: reply.created_at || new Date().toISOString(),
      is_solution: Boolean(reply.is_solution),
      user_has_liked: Boolean(reply.user_has_liked),
      author_avatar_url: reply.author_avatar_url || ''
    }))
    
    return NextResponse.json({ replies: transformedReplies })
  } catch (error) {
    console.error('Error fetching replies:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/forum/discussions/${params.id}/replies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 

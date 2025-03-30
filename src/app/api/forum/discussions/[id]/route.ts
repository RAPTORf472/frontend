import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')
    const url = `${baseUrl}/forum/discussions/${params.id}`
    
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
      
      if (response.status === 404) {
        return NextResponse.json({ message: 'Discussion not found' }, { status: 404 })
      }
      
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
    if (!data || typeof data !== 'object') {
      console.error('Invalid response data:', data)
      return NextResponse.json(
        { message: 'Invalid response from server' },
        { status: 500 }
      )
    }
    
    // Transform the data to ensure consistent field naming
    const transformedData = {
      id: data.id,
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || '',
      author_id: data.author_id,
      author_name: data.author_name || 'Unknown',
      category_name: data.category_name || 'Uncategorized',
      views_count: data.views_count || 0,
      likes_count: data.likes_count || 0,
      replies_count: data.replies_count || 0,
      has_solution: Boolean(data.has_solution || data.has_solution_flag || data.is_solved),
      created_at: data.created_at,
      is_liked: Boolean(data.is_liked),
      is_closed: Boolean(data.is_closed),
      user_has_liked: Boolean(data.user_has_liked),
      is_author: Boolean(data.is_author),
      category_id: data.category_id,
      author_avatar_url: data.author_avatar_url || ''
    }
    
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error fetching discussion:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')
    
    const response = await fetch(
      `${baseUrl}/forum/discussions/${params.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
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
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating discussion:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')
    
    const response = await fetch(
      `${baseUrl}/forum/discussions/${params.id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': request.headers.get('Authorization') || ''
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
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

    // If deletion is successful, return a 200 status with success message
    return NextResponse.json({ success: true, message: 'Discussion deleted successfully' })
  } catch (error) {
    console.error('Error deleting discussion:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 

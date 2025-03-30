import { NextRequest, NextResponse } from "next/server"

interface BackendDiscussion {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author_id: number;
  author_name: string;
  category_name: string;
  views_count: number;
  likes_count: number;
  replies_count: number;
  has_solution: boolean;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page') || '1'
    const category = searchParams.get('category')
    
    // Ensure trailing slash is handled correctly
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')
    const url = new URL(`${baseUrl}/forum`)
    
    // Add query parameters
    url.searchParams.set('page', page)
    if (category && category !== 'all') {
      url.searchParams.set('category', category)
    }
    
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
        console.error('Parsed error:', error)
        return NextResponse.json(error, { status: response.status })
      } catch (e) {
        return NextResponse.json(
          { message: `Backend error: ${response.status} ${response.statusText}` },
          { status: response.status }
        )
      }
    }

    const data = await response.json()

    // Handle empty or invalid response
    if (!data || typeof data !== 'object') {
      console.error('Invalid response data:', data)
      return NextResponse.json({
        discussions: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 1,
          totalItems: 0
        }
      })
    }

    // Transform the data into the expected format
    const transformedData = {
      discussions: Array.isArray(data.discussions) ? data.discussions.map((discussion: BackendDiscussion) => ({
        id: discussion.id,
        title: discussion.title,
        excerpt: discussion.excerpt || '',
        author_name: discussion.author_name || 'Unknown',
        category_name: discussion.category_name || 'Uncategorized',
        views_count: discussion.views_count || 0,
        likes_count: discussion.likes_count || 0,
        replies_count: discussion.replies_count || 0,
        has_solution: discussion.has_solution || false,
        created_at: discussion.created_at,
      })) : [],
      pagination: {
        currentPage: parseInt(page),
        totalPages: data.total_pages || Math.ceil((data.total || 0) / 10),
        totalItems: data.total || 0
      }
    }

    
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in discussions API:', error)
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Internal server error', 
        discussions: [], 
        pagination: { 
          currentPage: 1, 
          totalPages: 1, 
          totalItems: 0 
        } 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, category, excerpt } = body

    if (!title || !content || !category) {
      return NextResponse.json(
        { message: 'Title, content and category are required' },
        { status: 400 }
      )
    }

    // Generate a plain text excerpt if one wasn't provided
    const plainExcerpt = excerpt || content
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .substring(0, 200) + (content.length > 200 ? '...' : '');

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '')
    const response = await fetch(
      `${baseUrl}/forum`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          title,
          content,
          category,
          excerpt: plainExcerpt,
          tags: body.tags || []
        })
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
    console.error('Error creating discussion:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 

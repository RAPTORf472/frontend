import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/forum/categories`,
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
    
    // Transform the data to match the expected format
    if (data.categories) {
      data.categories = data.categories.map((category: any) => ({
        id: category.id,
        name: category.name || 'Unnamed Category',
        description: category.description || ''
      }))
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error', categories: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, category_id } = body

    // Validate required fields
    if (!title || !content || !category_id) {
      return NextResponse.json(
        { message: 'Title, content and category are required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/forum/discussions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify({
          title,
          content,
          category_id: parseInt(category_id),
          excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : '')
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
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

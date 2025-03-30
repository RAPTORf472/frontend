import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = searchParams.get('page') || '1'
    const tag = searchParams.get('tag')

    const queryParams = new URLSearchParams()
    if (category) queryParams.append('category', category)
    if (search) queryParams.append('search', search)
    if (page) queryParams.append('page', page)
    if (tag) queryParams.append('tag', tag)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/blog?${queryParams.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        }
      }
    )

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      let errorDetail = ''
      
      if (contentType?.includes('application/json')) {
        const errorJson = await response.json()
        errorDetail = JSON.stringify(errorJson)
      } else {
        errorDetail = await response.text()
      }

      console.error('Error response from backend:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        errorDetail
      })

      return NextResponse.json(
        { 
          success: false,
          message: `Failed to fetch blog posts: ${response.statusText}`,
          posts: []
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('Blog API Error:', error)
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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 

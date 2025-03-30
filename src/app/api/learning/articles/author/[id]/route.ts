import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    // Get exclude_id from query params if it exists
    const searchParams = request.nextUrl.searchParams
    const excludeId = searchParams.get('exclude_id')
    
    // Build URL with query params if necessary
    let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/articles/author/${id}`
    if (excludeId) {
      url += `?exclude_id=${excludeId}`
    }
    
    const response = await fetch(url, {
      cache: 'no-store' // Disable caching
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error response:', errorText)
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch author articles' },
      { status: 500 }
    )
  }
} 


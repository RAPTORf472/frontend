import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('content_type')

    const url = new URL(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/categories`)
    if (contentType && contentType !== 'all') {
      url.searchParams.append('content_type', contentType)
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to fetch categories',
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('Categories API Error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 })
  }
}

export async function GET_NEW() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/learning/categories`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch categories')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in categories route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
} 

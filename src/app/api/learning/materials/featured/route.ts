import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/featured`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch featured content')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching featured content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured content' },
      { status: 500 }
    )
  }
} 


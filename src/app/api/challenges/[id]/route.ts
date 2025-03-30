import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json()
    let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/challenges/${params.id}`
    
    switch (action) {
      case 'start':
        url += '/start'
        break
      case 'progress':
        url += '/progress'
        break
      case 'complete':
        url += '/complete'
        break
      case 'submit':
        url += '/submit'
        break
      default:
        throw new Error('Invalid action')
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify(await request.json())
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing challenge action:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 
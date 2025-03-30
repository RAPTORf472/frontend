import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple endpoint to record when a user views a learning material
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')
    
    // Make sure we have a proper token format for the backend
    const authHeader = token?.startsWith('Bearer ') ? token : token ? `Bearer ${token}` : ''
    
    // Call the backend API to record the view
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${params.id}/increment-view`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      }
    })

    // Return the response from the backend
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 

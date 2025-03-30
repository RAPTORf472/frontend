import { NextRequest, NextResponse } from 'next/server'

/**
 * Endpoint to record when a user completes reading a learning material
 * (by scrolling to the bottom)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')
    
    // Make sure we have a proper token format for the backend
    const authHeader = token?.startsWith('Bearer ') ? token : token ? `Bearer ${token}` : ''
    
    // Call the backend API to record the completion
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning/${params.id}/complete`, {
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

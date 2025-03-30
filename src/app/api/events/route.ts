import { NextRequest, NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get query parameters from the request URL
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const location = searchParams.get('location')
    const start_date = searchParams.get('start_date')

    // Get the authorization header
    const authHeader = request.headers.get('Authorization')
    
    // Build query string for backend
    const queryParams = new URLSearchParams()
    if (category) queryParams.append('category', category)
    if (status) queryParams.append('status', status)
    if (search) queryParams.append('search', search)
    if (location) queryParams.append('location', location)
    if (start_date) queryParams.append('start_date', start_date)

    const queryString = queryParams.toString()
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/events${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: data.message || 'Failed to fetch events',
        events: []
      }, { status: response.status })
    }

    // Log the number of events and check if they have registration status
        if (data.events && data.events.length > 0) {
      const hasRegistrationStatus = 'is_registered' in data.events[0]
          }

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('Events API Error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      events: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const headers = new Headers(request.headers)
  
  try {
    // Forward all relevant headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': headers.get('Authorization') || ''
    }

    // Add any additional headers from the original request
    headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
        requestHeaders[key] = value
      }
    })

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/events`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Failed to create event' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Events API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 


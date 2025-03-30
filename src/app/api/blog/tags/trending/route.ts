import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
        const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/blog/tags/trending`
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      }
    })

        
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error response from backend:', errorText)
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json(error, { status: response.status })
      } catch (e) {
        return NextResponse.json(
          { 
            success: false,
            message: `Backend error: ${response.status} ${response.statusText}`,
            tags: []
          },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
        
    return NextResponse.json({
      success: true,
      tags: data.tags || []
    })
  } catch (error) {
    console.error('Error fetching trending tags:', error)
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        tags: []
      },
      { status: 500 }
    )
  }
} 

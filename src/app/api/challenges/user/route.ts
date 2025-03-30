import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const url = `${baseUrl}/challenges/user`
    
        
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      }
    })

    if (!response.ok) {
      console.error('Error response from backend:', {
        status: response.status,
        statusText: response.statusText
      })
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    
    // Log the data structure for debugging
        
    // Validate and ensure consistent data structure
    const validateChallenge = (challenge: any) => {
      if (!challenge) return null
      
      // Ensure category is one of the valid enum values
      const validCategories = ['daily', 'weekly', 'monthly', 'one_time']
      if (!validCategories.includes(challenge.category)) {
        console.warn(`Invalid category found: ${challenge.category}`)
        challenge.category = 'one_time'
      }
      
      // Ensure difficulty is one of the valid enum values
      const validDifficulties = ['easy', 'medium', 'hard', 'expert']
      if (!validDifficulties.includes(challenge.difficulty)) {
        console.warn(`Invalid difficulty found: ${challenge.difficulty}`)
        challenge.difficulty = 'medium'
      }
      
      return challenge
    }
    
    // Process each challenge list
    const processedData = {
      available: (data.available || []).map(validateChallenge).filter(Boolean),
      active: (data.active || []).map(validateChallenge).filter(Boolean),
      completed: (data.completed || []).map(validateChallenge).filter(Boolean)
    }
    
    return NextResponse.json(processedData)
  } catch (error) {
    console.error('Error fetching user challenges:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 

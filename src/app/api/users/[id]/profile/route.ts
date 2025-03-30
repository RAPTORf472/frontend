import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate user ID is a number
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Get the authorization token if available
    const authHeader = request.headers.get('Authorization')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add authorization header if token is present
    if (authHeader) {
      headers['Authorization'] = authHeader.replace('Bearer ', '')
    }

    // Make the request to the backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}/profile`,
      {
        headers,
        cache: 'no-store' // Disable caching to ensure fresh data
      }
    )

    const data = await response.json()

    // If the backend returns a 404, format it consistently
    if (response.status === 404) {
      return NextResponse.json(
        { success: false, error: data.error || 'User not found' },
        { status: 404 }
      )
    }

    // If there's any other error
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch profile' },
        { status: response.status }
      )
    }

    // If the backend already returns success: true format, just pass it through
    if (data.success === true && data.user && data.stats) {
      // Ensure the response has all expected fields with defaults
      const transformedData = {
        success: true,
        user: {
          ...data.user,
          exp: data.user.exp || 0,
          level: data.user.level || 1,
          last_login: null, // Add this for compatibility with auth context
          roles: [] // Add this for compatibility with auth context
        },
        stats: {
          ...data.stats,
          trees_planted: data.stats.trees_planted || 0,
          events_joined: data.stats.events_joined || 0,
          co2_offset: data.stats.co2_offset || 0,
          followers_count: data.stats.followers_count || 0,
          following_count: data.stats.following_count || 0,
          volunteer_hours: 0, // Removed as agreed
          // Add these for compatibility with profile page
          events_created: 0,
          achievements_earned: 0,
          forum_posts: 0
        },
        group: data.group,
        is_following: data.is_following || false,
        chatGroups: data.chatGroups || [],
        achievements: data.achievements || [],
        activities: data.activities || []
      }
      return NextResponse.json(transformedData)
    }

    // If the backend returns a different format, transform it
    return NextResponse.json({
      success: true,
      user: {
        id: data.id || 0,
        username: data.username || '',
        exp: data.exp || 0,
        level: data.level || Math.floor((data.exp || 0) / 100) + 1,
        created_at: data.created_at || new Date().toISOString(),
        last_login: null,
        roles: []
      },
      stats: {
        trees_planted: 0,
        events_joined: 0,
        co2_offset: 0,
        followers_count: 0,
        following_count: 0,
        volunteer_hours: 0,
        events_created: 0,
        achievements_earned: 0,
        forum_posts: 0
      },
      group: null,
      is_following: false,
      chatGroups: [],
      achievements: [],
      activities: []
    })
  } catch (error) {
    console.error('Error in profile route:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      },
      { status: 500 }
    )
  }
} 
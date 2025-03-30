import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    
    if (!backendUrl) {
      throw new Error('Backend URL is not configured');
    }

    if (!token) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

        
    const achievementsResponse = await fetch(`${backendUrl}/achievements`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

        
    if (!achievementsResponse.ok) {
      const errorText = await achievementsResponse.text();
      console.error('API Route - Backend error:', {
        status: achievementsResponse.status,
        error: errorText,
        url: `${backendUrl}/achievements`
      });
      return Response.json({ 
        success: false, 
        error: `Failed to fetch achievements: ${achievementsResponse.status} ${errorText}` 
      }, { status: achievementsResponse.status });
    }

    const achievementsData = await achievementsResponse.json();
    
    const processedData = {
      success: true,
      achievements: achievementsData.achievements?.map((achievement: any) => {
        if (achievement.criteria && typeof achievement.criteria === 'string') {
          try {
            achievement.criteria = JSON.parse(achievement.criteria);
          } catch (e) {
            console.error('Error parsing criteria:', e);
          }
        }
        return achievement;
      }) || []
    };

    return Response.json(processedData);
  } catch (error) {
    console.error('API Route - Error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    
    if (!backendUrl) {
      throw new Error('Backend URL is not configured');
    }

    if (!token) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const refreshResponse = await fetch(`${backendUrl}/achievements/refresh-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('API Route - Backend error:', {
        status: refreshResponse.status,
        error: errorText
      });
      return Response.json({ 
        success: false, 
        error: `Failed to refresh stats: ${refreshResponse.status} ${errorText}` 
      }, { status: refreshResponse.status });
    }

    const refreshData = await refreshResponse.json();
    
    return Response.json(refreshData);
  } catch (error) {
    console.error('API Route - Error:', error);
    return Response.json(
      { success: false, error: 'Failed to refresh stats' },
      { status: 500 }
    );
  }
} 

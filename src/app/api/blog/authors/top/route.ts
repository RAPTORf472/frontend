import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '5';
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/blog/authors/top?limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching top authors: ${error}`);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch top authors' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in top authors API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top authors' },
      { status: 500 }
    );
  }
} 
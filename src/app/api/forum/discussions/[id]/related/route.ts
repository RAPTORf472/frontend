import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const discussionId = params.id;
    
    // Get the limit from search params (default to 5)
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forum/discussions/${discussionId}/related?limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error fetching related discussions: ${error}`);
      return NextResponse.json(
        { success: false, error: `Failed to fetch related discussions` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in related discussions API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related discussions' },
      { status: 500 }
    );
  }
} 
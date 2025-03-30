import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const discussionId = params.id;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/forum/discussions/${discussionId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Error tracking discussion view: ${error}`);
      return NextResponse.json(
        { success: false, error: `Failed to track discussion view` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in view tracking API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track discussion view' },
      { status: 500 }
    );
  }
} 
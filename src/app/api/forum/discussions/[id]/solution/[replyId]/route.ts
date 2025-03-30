import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; replyId: string } }
) {
  try {
    // Convert string IDs to integers
    const discussionId = parseInt(params.id, 10);
    const replyId = parseInt(params.replyId, 10);

    // Validate that the IDs are valid numbers
    if (isNaN(discussionId) || isNaN(replyId)) {
      return NextResponse.json(
        { message: 'Invalid discussion or reply ID' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const url = `${baseUrl}/forum/discussions/${discussionId}/solution/${replyId}`;
    
    const token = request.headers.get('Authorization');
    if (!token) {
            return NextResponse.json(
        { message: 'Authorization required' },
        { status: 401 }
      );
    }

        const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });


    if (!response.ok) {
      const responseText = await response.text();
      console.error('Error response from backend:', {
        status: response.status,
        text: responseText
      });
      
      let error;
      try {
        error = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse error response:', e);
        error = { message: responseText };
      }
      
      return NextResponse.json(
        { message: error.message || error.error || 'Failed to mark solution' },
        { status: response.status }
      );
    }

    const data = await response.json();
        return NextResponse.json(data);
  } catch (error) {
    console.error('Error marking solution:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 


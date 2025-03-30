import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, postId: string } }
) {
  try {
    const data = await request.json()
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/groups/${params.id}/posts/${params.postId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API Route] Error updating group post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, postId: string } }
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/groups/${params.id}/posts/${params.postId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API Route] Error deleting group post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
} 
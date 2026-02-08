import { NextRequest, NextResponse } from 'next/server'

// In-memory store for parsing status (in production, use Redis or a database)
const parsingStatus: Record<string, { status: string; completed: boolean; timestamp: number }> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status, completed } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Store the parsing status
    parsingStatus[sessionId] = {
      status: status || 'completed',
      completed: completed !== undefined ? completed : true,
      timestamp: Date.now()
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status updated',
      sessionId 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const status = parsingStatus[sessionId]

  if (!status) {
    return NextResponse.json({ 
      status: 'pending', 
      completed: false 
    })
  }

  // Clean up old entries (older than 1 hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  if (status.timestamp < oneHourAgo) {
    delete parsingStatus[sessionId]
    return NextResponse.json({ 
      status: 'expired', 
      completed: false 
    })
  }

  return NextResponse.json(status)
}





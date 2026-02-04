import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the n8n chat webhook URL
    const n8nChatWebhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL || 
      'https://n8n.srv1166732.hstgr.cloud/webhook/81c3afff-ff47-4f64-9781-a46a43ee069e'

    // Forward the request to n8n
    const response = await fetch(n8nChatWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText || 'Failed to get chat response' },
        { status: response.status }
      )
    }

    // Return the response from n8n
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Chat proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


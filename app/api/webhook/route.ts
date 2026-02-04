import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Get the n8n webhook URL
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
      'https://n8n.srv1166732.hstgr.cloud/webhook/03d9c773-8d8a-4691-b0d0-a11e1b4cbe47'

    // Forward the FormData to n8n
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText || 'Failed to trigger workflow' },
        { status: response.status }
      )
    }

    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Workflow triggered successfully' 
    })
  } catch (error) {
    console.error('Webhook proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


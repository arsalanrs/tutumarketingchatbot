'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import '../globals.css'

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check authentication
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem('isAuthenticated')
      if (isAuthenticated !== 'true') {
        router.push('/')
      }
    }
  }, [router])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('sessionId')
    }
    router.push('/')
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Get or create session ID
      let sessionId = localStorage.getItem('sessionId')
      if (!sessionId) {
        sessionId = `session_${Date.now()}`
        localStorage.setItem('sessionId', sessionId)
      }

      // n8n chat webhook URL - using the chat trigger webhook
      const chatWebhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL || 
        'https://n8n.srv1166732.hstgr.cloud/webhook/81c3afff-ff47-4f64-9781-a46a43ee069e'

      const response = await fetch(chatWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Handle different response formats from n8n chat
        // The AI Agent might return output in different formats
        let assistantMessage = ''
        
        // Handle response from n8n chat workflow
        // The AI Agent returns output, which might be:
        // 1. Plain text for general questions
        // 2. JSON string for creative ad generation
        // 3. Object with output property
        
        if (typeof data === 'string') {
          assistantMessage = data
        } else if (data.output) {
          // Check if output is JSON string (for creative ads) or plain text
          const outputStr = typeof data.output === 'string' 
            ? data.output 
            : data.output.text || data.output.content || JSON.stringify(data.output)
          
          // Try to detect if it's JSON (creative ad format)
          if (outputStr.trim().startsWith('{') && outputStr.includes('"rows"')) {
            // It's a creative ad JSON - format it nicely for display
            try {
              const parsed = JSON.parse(outputStr.replace(/```json\s*/gi, '').replace(/```/g, '').trim())
              if (parsed.rows && parsed.rows.length > 0) {
                const row = parsed.rows[0]
                assistantMessage = `✅ Creative Ad Created!\n\n` +
                  `**Name:** ${row.NAME || 'N/A'}\n` +
                  `**Format:** ${row.FORMAT || 'N/A'}\n` +
                  `**Offer/Angle:** ${row['OFFER / ANGLE'] || 'N/A'}\n` +
                  `**Target ICP:** ${row['TARGET ICP'] || 'N/A'}\n` +
                  `**Copy/Script:** ${row['COPY / SCRIPT'] || 'N/A'}\n` +
                  `**Brief:** ${row['BRIEF DESCRIPTION'] || 'N/A'}\n\n` +
                  `*This has been saved to your Creative Pipeline sheet.*`
              } else {
                assistantMessage = outputStr
              }
            } catch {
              // Not valid JSON, treat as plain text
              assistantMessage = outputStr
            }
          } else {
            // Plain text response
            assistantMessage = outputStr
          }
        } else if (data.message) {
          assistantMessage = data.message
        } else if (data.response) {
          assistantMessage = data.response
        } else if (data.text) {
          assistantMessage = data.text
        } else if (data.data?.output) {
          assistantMessage = data.data.output
        } else {
          // Fallback: try to extract any text
          assistantMessage = JSON.stringify(data).substring(0, 500) || 'No response received'
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }])
      } else {
        const errorData = await response.text()
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${errorData || 'Failed to get response'}` 
        }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Network error: ${err instanceof Error ? err.message : 'Failed to connect to chat service'}` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <button onClick={handleSignOut} className="signOutButton">
        SIGN OUT
      </button>

      <div className="chatContainer">
        <div className="chatHeader">
          <h1 className="chatTitle">Tutu Marketing Assistant</h1>
          <p className="chatSubtitle">Discuss your data and create ads</p>
        </div>

        <div className="chatMessages">
          {messages.length === 0 && (
            <div className="welcomeMessage">
              <p>Welcome! I'm your Tutu Marketing Creative Assistant.</p>
              <p>I have access to your Offers Library, Formats Library, Angles Library, Creative Matrix, and Creative Pipeline.</p>
              <p>You can ask me to create ads, discuss strategies, or review your creative pipeline.</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="messageContent">
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="messageContent">
                <span className="loading"></span>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chatInputForm">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="chatInput"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="chatSendButton"
            disabled={isLoading || !inputMessage.trim()}
          >
            SEND
          </button>
        </form>
      </div>

      <footer className="footer">
        <div>COPYRIGHT © 2023 TUTU MARKETING. ALL RIGHTS RESERVED.</div>
        <div className="footerLinks">
          <a href="#" className="footerLink">PRIVACY POLICY</a>
          <a href="#" className="footerLink">TERMS & CONDITIONS</a>
        </div>
      </footer>
    </div>
  )
}


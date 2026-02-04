'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './globals.css'

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  const [companyName, setCompanyName] = useState('')
  const [productCategory, setProductCategory] = useState('')
  const [knowledgebaseText, setKnowledgebaseText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parsingStatus, setParsingStatus] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('isAuthenticated')
      setIsLoggedIn(loggedIn === 'true')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    // Hardcoded credentials
    const validEmail = 'director@tutumarketing.com'
    const validPassword = 'tutu965#'

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (email === validEmail && password === validPassword) {
      // Store authentication
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userEmail', email)
      }
      setIsLoggedIn(true)
    } else {
      setLoginError('Invalid email or password. Please try again.')
      setIsLoggingIn(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Extract company name from URL for sessionId
      let companyNameFromUrl = companyName
      try {
        const url = new URL(companyName)
        companyNameFromUrl = url.hostname.replace('www.', '').split('.')[0]
      } catch {
        // If not a valid URL, use the input as-is
        companyNameFromUrl = companyName.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0].split('.')[0]
      }
      
      // Generate session ID based on company name (from URL) and timestamp
      const sessionId = `${companyNameFromUrl.replace(/\s+/g, '_')}_${Date.now()}`
      localStorage.setItem('sessionId', sessionId)

      // Create FormData to handle text input
      const formData = new FormData()
      formData.append('Company URL', companyName)
      formData.append('Product Category', productCategory)
      formData.append('sessionId', sessionId) // Pass sessionId to n8n
      
      if (knowledgebaseText.trim()) {
        formData.append('Knowledgebase', knowledgebaseText)
      }

      // Use Next.js API route as proxy to avoid CORS issues
      const response = await fetch('/api/webhook', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setSuccess('Workflow triggered successfully! Data is being processed...')
        setParsingStatus('Parsing data and ingesting to Pinecone...')
        
        // Store company name (extracted from URL) for matching (since Pinecone workflow uses Company Name)
        localStorage.setItem('pendingCompanyName', companyNameFromUrl)
        
        // Start polling for parsing completion
        // Try both exact sessionId and company name match
        const pollInterval = setInterval(async () => {
          try {
            // Try exact sessionId first
            let statusResponse = await fetch(`/api/parsing-status?sessionId=${sessionId}`)
            let statusData = await statusResponse.json()
            
            // If not found, try matching by company name (fallback)
            if (!statusData.completed && companyNameFromUrl) {
              const companyNameId = companyNameFromUrl.replace(/\s+/g, '_')
              statusResponse = await fetch(`/api/parsing-status?sessionId=${companyNameId}`)
              statusData = await statusResponse.json()
            }
            
            if (statusData.completed) {
              clearInterval(pollInterval)
              setParsingStatus('Parsing completed!')
              localStorage.removeItem('pendingCompanyName')
              setTimeout(() => {
                router.push('/chat')
              }, 2000)
            } else if (statusData.status === 'expired') {
              clearInterval(pollInterval)
              setError('Parsing status expired. Please try again.')
            }
          } catch (err) {
            console.error('Error polling status:', err)
          }
        }, 2000) // Poll every 2 seconds
        
        // Stop polling after 5 minutes (timeout)
        setTimeout(() => {
          clearInterval(pollInterval)
          if (parsingStatus !== 'Parsing completed!') {
            setError('Parsing is taking longer than expected. You can proceed to chat anyway.')
          }
        }, 5 * 60 * 1000)
        
        // Clear form fields
        setCompanyName('')
        setProductCategory('')
        setKnowledgebaseText('')
      } else {
        const errorData = await response.text()
        setError(`Failed to trigger workflow: ${errorData || 'Unknown error'}`)
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Failed to connect to server'}`)
    } finally {
      setIsLoading(false)
    }
  }


  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userEmail')
    }
    setIsLoggedIn(false)
    setCompanyName('')
    setProductCategory('')
    setKnowledgebaseText('')
  }

  // Login Form
  if (!isLoggedIn) {
    return (
      <div className="container">
        <div className="mainContent">
          <div className="card">
            <form onSubmit={handleLogin} className="form">
              <div className="formGroup">
                <label htmlFor="email" className="label">
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your Email"
                  className="input"
                  required
                  disabled={isLoggingIn}
                />
              </div>

              <div className="formGroup">
                <label htmlFor="password" className="label">
                  Your Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your Password"
                  className="input"
                  required
                  disabled={isLoggingIn}
                />
              </div>

              {loginError && <div className="error">{loginError}</div>}

              <button
                type="submit"
                className="button"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <span className="loading"></span>
                    SIGNING IN...
                  </>
                ) : (
                  'SIGN IN'
                )}
              </button>
            </form>

            <div className="infoSection">
              <h1 className="title">Marketing Automation</h1>
              <div className="titleLine"></div>
              <p className="subtitle">
                Streamline your marketing workflows with intelligent automation. Trigger comprehensive market research, competitive analysis, and creative strategy generation with a single form submission.
              </p>
            </div>
          </div>
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

  // Workflow Form (after login)
  return (
    <div className="container">
      <div className="mainContent">
        <button onClick={handleSignOut} className="signOutButton">
          SIGN OUT
        </button>
        <div className="card">
          <form onSubmit={handleSubmit} className="form">
            <div className="formGroup">
              <label htmlFor="companyUrl" className="label">
                Company URL
              </label>
              <input
                id="companyUrl"
                type="url"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="https://example.com"
                className="input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="productCategory" className="label">
                Product Category
              </label>
              <input
                id="productCategory"
                type="text"
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                placeholder="Product Category"
                className="input"
                required
                disabled={isLoading}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="knowledgebase" className="label">
                Knowledgebase (Optional)
              </label>
              <textarea
                id="knowledgebase"
                value={knowledgebaseText}
                onChange={(e) => setKnowledgebaseText(e.target.value)}
                placeholder="Enter your knowledge base information here..."
                className="textarea"
                disabled={isLoading}
                rows={8}
              />
            </div>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            {parsingStatus && (
              <div className={`parsingStatus ${parsingStatus.includes('completed') ? 'completed' : ''}`}>
                {parsingStatus}
                {!parsingStatus.includes('completed') && <span className="loading"></span>}
              </div>
            )}

            <button
              type="submit"
              className="button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading"></span>
                  TRIGGERING WORKFLOW...
                </>
              ) : (
                'TRIGGER WORKFLOW'
              )}
            </button>
          </form>

          <div className="infoSection">
            <h1 className="title">Tutu Marketing</h1>
            <div className="titleLine"></div>
          </div>
        </div>
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


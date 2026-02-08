# Setting up Tunnel for n8n to Access Localhost

## Problem
n8n is running on a remote server and cannot access `localhost:3002` on your local machine.

## Solution: Use ngrok

### Step 1: Install ngrok
Download from https://ngrok.com/download or install via Homebrew:
```bash
brew install ngrok
```

### Step 2: Start ngrok tunnel
In a new terminal, run:
```bash
ngrok http 3002
```

This will give you a public URL like: `https://abc123.ngrok.io`

### Step 3: Update n8n Workflow
In your n8n workflow, change the HTTP Request node URL from:
```
http://localhost:3002/api/parsing-status
```

To:
```
https://YOUR_NGROK_URL.ngrok.io/api/parsing-status
```

Replace `YOUR_NGROK_URL` with the actual ngrok URL you got in Step 2.

### Step 4: Keep ngrok running
Keep the ngrok terminal window open while testing. The URL will change each time you restart ngrok (unless you have a paid plan with a static URL).

## Alternative: Deploy to Production
For a permanent solution, deploy your Next.js app to:
- Vercel (recommended for Next.js)
- Railway
- Render
- Any other hosting service

Then update the n8n workflow to use the production URL instead of localhost.



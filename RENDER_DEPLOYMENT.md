# Deploying to Render

This guide will help you deploy the Tutu Marketing frontend to Render so that n8n can access it.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Push to Git Repository

If you haven't already, initialize git and push to a repository:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 2: Create New Web Service on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Select the repository containing this project

## Step 3: Configure the Service

### Basic Settings:
- **Name**: `tutumarketing-frontend` (or any name you prefer)
- **Environment**: `Node`
- **Region**: Choose closest to your n8n server
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or `.` if needed)

### Build & Deploy:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Environment Variables:
Add these in the Render dashboard under "Environment":

```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.srv1166732.hstgr.cloud/webhook/03d9c773-8d8a-4691-b0d0-a11e1b4cbe47
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://n8n.srv1166732.hstgr.cloud/webhook/81c3afff-ff47-4f64-9781-a46a43ee069e
NODE_ENV=production
```

**Note**: Render will automatically set the `PORT` environment variable, so you don't need to set it manually.

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will start building and deploying your app
3. Wait for the deployment to complete (usually 2-5 minutes)

## Step 5: Get Your Public URL

Once deployed, Render will provide you with a URL like:
- `https://tutumarketing-frontend.onrender.com`

## Step 6: Update n8n Workflow

In your n8n workflow, update the HTTP Request node that sends parsing status:

**Change from:**
```
http://localhost:3002/api/parsing-status
```

**Change to:**
```
https://YOUR_RENDER_URL.onrender.com/api/parsing-status
```

Replace `YOUR_RENDER_URL` with your actual Render URL.

## Step 7: Test

1. Visit your Render URL in a browser
2. Log in with: `director@tutumarketing.com` / `tutu965#`
3. Submit the form
4. Check that n8n receives the webhook and can send status updates back

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### App Crashes
- Check the runtime logs in Render dashboard
- Verify environment variables are set correctly
- Ensure the PORT is being used correctly (Render sets this automatically)

### n8n Still Can't Connect
- Verify the Render URL is correct in n8n workflow
- Check that the Render service is running (not sleeping)
- Free tier services sleep after inactivity - consider upgrading or using a keep-alive service

## Free Tier Limitations

Render's free tier:
- Services may sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider using a service like UptimeRobot to ping your app every 5 minutes to keep it awake

## Upgrading (Optional)

For production use, consider upgrading to a paid plan for:
- Always-on service (no sleeping)
- Better performance
- More resources



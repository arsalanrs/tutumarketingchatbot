#!/bin/bash

# Deployment script for Air Publisher Server
# This script deletes all files and pulls the latest code from GitHub

set -e  # Exit on error

APP_DIR="/opt/apps/air-publisher"
GIT_REPO="https://github.com/arsalanrs/tutumarketingchatbot.git"
BACKUP_DIR="/opt/apps/backups"

echo "🚀 Starting deployment..."

# Step 1: Create backup
echo "📦 Creating backup..."
sudo mkdir -p $BACKUP_DIR
sudo tar -czf $BACKUP_DIR/air-publisher-backup-$(date +%Y%m%d-%H%M%S).tar.gz $APP_DIR 2>/dev/null || echo "No existing files to backup"

# Step 2: Stop running processes
echo "🛑 Stopping running processes..."
sudo lsof -ti:3003 | xargs sudo kill -9 2>/dev/null || echo "No process on port 3003"
sudo lsof -ti:5003 | xargs sudo kill -9 2>/dev/null || echo "No process on port 5003"

# Step 3: Remove all existing files
echo "🗑️  Removing existing files..."
cd $APP_DIR
sudo rm -rf ./* .[!.]* 2>/dev/null || echo "Directory already empty"

# Step 4: Clone latest code
echo "📥 Cloning latest code from GitHub..."
sudo git clone $GIT_REPO .

# Step 5: Set correct permissions
echo "🔐 Setting permissions..."
sudo chown -R air_publisher_user:air_publisher_user $APP_DIR

# Step 6: Install dependencies
echo "📦 Installing dependencies..."
cd $APP_DIR
npm install

# Step 7: Build application
echo "🔨 Building application..."
npm run build

# Step 8: Create .env.local if it doesn't exist
if [ ! -f "$APP_DIR/.env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > $APP_DIR/.env.local << EOF
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.srv1166732.hstgr.cloud/webhook/03d9c773-8d8a-4691-b0d0-a11e1b4cbe47
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://n8n.srv1166732.hstgr.cloud/webhook/81c3afff-ff47-4f64-9781-a46a43ee069e
NODE_ENV=production
PORT=3003
EOF
    sudo chown air_publisher_user:air_publisher_user $APP_DIR/.env.local
fi

# Step 9: Start application with PM2
echo "▶️  Starting application..."
if command -v pm2 &> /dev/null; then
    pm2 delete tutumarketing 2>/dev/null || echo "No existing PM2 process"
    PORT=3003 pm2 start npm --name "tutumarketing" -- start
    pm2 save
    echo "✅ Application started with PM2"
    pm2 status
else
    echo "⚠️  PM2 not found. Installing PM2..."
    npm install -g pm2
    PORT=3003 pm2 start npm --name "tutumarketing" -- start
    pm2 save
    pm2 startup
    echo "✅ Application started with PM2"
fi

echo "🎉 Deployment completed successfully!"
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs tutumarketing"



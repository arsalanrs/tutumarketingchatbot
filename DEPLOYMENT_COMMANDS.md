# Deployment Commands for Air Publisher Server

## Server Details
- **Server**: Member 3 Air Publisher
- **User**: air_publisher_user
- **Password**: App8899n@123
- **Directory**: /opt/apps/air-publisher
- **Ports**: 3003, 5003

## Steps to Deploy Latest Code

### 1. SSH into the server
```bash
ssh air_publisher_user@<server-ip>
# Enter password: App8899n@123
```

### 2. Navigate to the application directory
```bash
cd /opt/apps/air-publisher
```

### 3. Backup existing files (optional but recommended)
```bash
# Create a backup directory with timestamp
sudo mkdir -p /opt/apps/backups
sudo tar -czf /opt/apps/backups/air-publisher-backup-$(date +%Y%m%d-%H%M%S).tar.gz /opt/apps/air-publisher
```

### 4. Stop any running services
```bash
# Check if Node.js process is running on port 3003 or 5003
sudo lsof -i :3003
sudo lsof -i :5003

# Kill processes if found (replace PID with actual process ID)
# sudo kill -9 <PID>
```

### 5. Delete all existing files
```bash
# Remove all files and directories in the app folder
sudo rm -rf /opt/apps/air-publisher/*
sudo rm -rf /opt/apps/air-publisher/.*
```

### 6. Clone the latest code from GitHub
```bash
cd /opt/apps/air-publisher
sudo git clone https://github.com/arsalanrs/tutumarketingchatbot.git .
```

### 7. Install dependencies
```bash
cd /opt/apps/air-publisher
sudo npm install
```

### 8. Build the application
```bash
sudo npm run build
```

### 9. Set up environment variables
```bash
# Create .env.local file with required variables
sudo nano .env.local
```

Add these variables:
```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.srv1166732.hstgr.cloud/webhook/03d9c773-8d8a-4691-b0d0-a11e1b4cbe47
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://n8n.srv1166732.hstgr.cloud/webhook/81c3afff-ff47-4f64-9781-a46a43ee069e
NODE_ENV=production
PORT=3003
```

### 10. Start the application
```bash
# Using PM2 (recommended for production)
sudo npm install -g pm2
sudo pm2 start npm --name "tutumarketing" -- start
sudo pm2 save
sudo pm2 startup

# Or using nohup
# sudo nohup npm start > /opt/apps/air-publisher/logs/app.log 2>&1 &
```

### 11. Verify the deployment
```bash
# Check if the app is running
curl http://localhost:3003

# Check PM2 status
sudo pm2 status

# View logs
sudo pm2 logs tutumarketing
```

## Alternative: Using Git Pull (if directory already exists as git repo)

If the directory is already a git repository:

```bash
cd /opt/apps/air-publisher
sudo git fetch origin
sudo git reset --hard origin/main
sudo git clean -fd
sudo npm install
sudo npm run build
sudo pm2 restart tutumarketing
```

## Troubleshooting

### Permission Issues
If you encounter permission issues:
```bash
# Change ownership
sudo chown -R air_publisher_user:air_publisher_user /opt/apps/air-publisher
```

### Port Already in Use
```bash
# Find and kill process using the port
sudo lsof -ti:3003 | xargs sudo kill -9
sudo lsof -ti:5003 | xargs sudo kill -9
```

### Git Authentication
If GitHub requires authentication:
```bash
# Use personal access token
sudo git clone https://ghp_YOUR_TOKEN@github.com/arsalanrs/tutumarketingchatbot.git .
```



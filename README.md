# Tutu Marketing Frontend

A Next.js frontend application for triggering n8n marketing workflow automation.

## Features

- **Secure Login**: Hardcoded authentication with director@tutumarketing.com
- **Workflow Form**: Submit company name and product category to trigger n8n workflow
- **Protected Routes**: Authentication-based route protection
- **Modern UI**: Beautiful gradient design with smooth animations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure n8n webhook URL (optional):
   - The webhook URL is already configured in the code
   - If you need to override it, create a `.env.local` file in the root directory
   - Add your n8n webhook URL:
   ```
   NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.srv1166732.hstgr.cloud/webhook/03d9c773-8d8a-4691-b0d0-a11e1b4cbe47
   ```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3002](http://localhost:3002) in your browser

## Login Credentials

- **Email**: director@tutumarketing.com
- **Password**: tutu965#

## How to Get Your n8n Webhook URL

1. Open your n8n workflow
2. Find the "On form submission" node (Form Trigger)
3. Click on the node to see the webhook URL
4. Copy the full webhook URL and add it to your `.env.local` file

The webhook URL is:
```
https://n8n.srv1166732.hstgr.cloud/webhook/03d9c773-8d8a-4691-b0d0-a11e1b4cbe47
```

## Project Structure

```
tutumarketing/
├── app/
│   ├── form/
│   │   └── page.tsx      # Form page (protected)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Login page
│   └── globals.css        # Global styles
├── .env.local.example     # Environment variables example
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Build for Production

```bash
npm run build
npm start
```

## Notes

- Authentication is stored in localStorage (client-side only)
- For production, consider implementing server-side authentication
- The webhook URL must be configured correctly for the form submission to work


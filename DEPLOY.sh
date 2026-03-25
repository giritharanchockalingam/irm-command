#!/bin/bash
# ============================================================
# IRM Sentinel — One-click deploy to GitHub + Vercel
# Run this from the irm-sentinel project directory:
#   cd "/path/to/ACL Digital/irm-command"
#   chmod +x DEPLOY.sh && ./DEPLOY.sh
# ============================================================

set -e

echo "🚀 IRM Sentinel Deployment Script"
echo "================================="

# Step 1: Initialize git (if not already)
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
  git branch -M main
else
  echo "📦 Git already initialized."
fi

# Step 2: Set remote (if not already)
if ! git remote | grep -q origin; then
  echo "🔗 Adding GitHub remote..."
  git remote add origin https://github.com/giritharanchockalingam/irm-sentinel.git
else
  echo "🔗 Remote 'origin' already set."
fi

# Step 3: Stage all source files (respecting .gitignore)
echo "📂 Staging files..."
git add -A

# Step 4: Commit
echo "💾 Committing..."
git commit -m "feat: IRM Sentinel with Supabase integration and full GRC platform

- React 18 + TypeScript + Vite + Tailwind CSS
- Zustand state management with dark/light mode
- Supabase integration (irm schema) with DataAccessLayer
- Demo auth mode for prototype deployment
- 9 pages: Dashboard, TPRM, Compliance, Workbench, Copilot, AI Command Center, Control Register, Exceptions, Architecture
- AI-powered Copilot with template engine and MCP tools
- RBAC, audit logging, telemetry infrastructure
- Vercel-ready with SPA routing"

# Step 5: Force push (overwrites any existing commits from web UI)
echo "⬆️  Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "================================="
echo "NEXT STEPS — Vercel Deployment:"
echo "================================="
echo ""
echo "1. Go to: https://vercel.com/new"
echo "2. Import: giritharanchockalingam/irm-command"
echo "3. Framework: Vite"
echo "4. Set these Environment Variables:"
echo ""
echo "   VITE_SUPABASE_URL     = https://ysesfztvcexufoogjgth.supabase.co"
echo "   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZXNmenR2Y2V4dWZvb2dqZ3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjkxOTAsImV4cCI6MjA4ODY0NTE5MH0.QA27noSojFdExTDGqV31lA9CYs5x2zfGG0QWOCD0CLU"
echo "   VITE_SUPABASE_SCHEMA  = irm"
echo "   VITE_AUTH_MODE         = demo"
echo ""
echo "5. Click Deploy!"
echo ""
echo "The app will auto-login as Sarah Chen (CRO) in demo mode."
echo "================================="

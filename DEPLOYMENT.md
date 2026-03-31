# Mithra Deployment Guide

This document is the current deployment reference for the Raksha MVP app.

## Current Production Architecture

Raksha MVP is deployed as two separate services:

- **Frontend**: Vercel - https://mithra-kappa.vercel.app
- **Backend**: Render - https://raksha-mvp-backend.onrender.com

### Service Details

**Backend (Render)**
- Service Name: `raksha-mvp-backend`
- Service ID: `srv-d75j68dm5p6s73c2d7rg`
- URL: https://raksha-mvp-backend.onrender.com
- WebSocket: wss://raksha-mvp-backend.onrender.com/ws/live
- Health Check: https://raksha-mvp-backend.onrender.com/health

**Frontend (Vercel)**
- Project Name: `mithra`
- Production URL: https://mithra-p4vtdxnya-bezaspaces-projects.vercel.app
- Aliased URL: https://mithra-kappa.vercel.app (primary domain)
- GitHub Repo: https://github.com/bezaspace/mithra-development.git

## Production Request Flow

1. Browser loads the React app from Vercel (mithra-kappa.vercel.app)
2. Frontend HTTP API calls use the Vercel origin and are rewritten to Render backend
3. Frontend voice WebSocket connects directly to Render (WebSocket is NOT proxied through Vercel)

In practice:
- HTTP API requests go to paths like `/api/...` and `/health` on the Vercel domain
- WebSocket voice traffic goes straight to Render at `wss://raksha-mvp-backend.onrender.com/ws/live`

## Why We Split the Deployment

- **Vercel**: Perfect for static Vite React builds and SPA routing
- **Render**: Needed for FastAPI + persistent WebSocket server for live voice
- SQLite databases work fine on Render free tier for this MVP

## Repository Structure

```
back end/          # FastAPI backend
front end/         # Vite + React frontend
render.yaml        # Render blueprint for backend deployment
vercel.json        # Vercel config (root level - deploys from repo root)
```

## Environment Variables

### Backend (Render)

Required (set via Render dashboard or API):
- `GEMINI_API_KEY` - Google Gemini API key (secret, never committed)

Non-secret (set via render.yaml):
- `GEMINI_MODEL` - `gemini-3.1-flash-live-preview` ⚠️ **CRITICAL**: NOT the deprecated 2.5 model
- `APP_NAME` - `raksha`
- `FRONTEND_ORIGIN` - `https://mithra-kappa.vercel.app`
- `LOG_LEVEL` - `info`
- `PYTHON_VERSION` - `3.11.11`

### Frontend (Vercel)

No env vars strictly required - the frontend uses relative URLs in production.

Optional (for explicit configuration):
- `VITE_BACKEND_HTTP_URL` - Production frontend URL for HTTP
- `VITE_BACKEND_WS_URL` - Direct Render WebSocket URL

## Backend Deployment Process (Render)

### 1. Create Render Service

```bash
# Set workspace (if not already set)
render workspace set tea-d6rmqcfdiees73btepbg

# Create new service
render services create --type web_service \
  --name raksha-mvp-backend \
  --repo https://github.com/bezaspace/mithra-development.git \
  --branch master \
  --root-directory "back end" \
  --runtime python \
  --plan free \
  --region oregon \
  --build-command "pip install uv && uv sync --frozen" \
  --start-command ".venv/bin/uvicorn app.main:app --host 0.0.0.0 --port \$PORT" \
  --health-check-path /health \
  --env-var "PYTHON_VERSION=3.11.11" \
  --env-var "APP_NAME=raksha" \
  --env-var "GEMINI_MODEL=gemini-3.1-flash-live-preview" \
  --env-var "FRONTEND_ORIGIN=https://mithra-kappa.vercel.app" \
  --env-var "LOG_LEVEL=info" \
  --auto-deploy=false \
  --confirm
```

### 2. Set Secret Environment Variables

**CRITICAL**: Set `GEMINI_API_KEY` via Render dashboard or API. Never commit this to git.

```bash
# Using Render API (requires RENDER_API_KEY env var)
curl -X PUT "https://api.render.com/v1/services/srv-d75j68dm5p6s73c2d7rg/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[{"key": "GEMINI_API_KEY", "value": "YOUR_GEMINI_KEY_HERE"}]'
```

### 3. Deploy Backend

```bash
# Trigger manual deploy
render deploys create srv-d75j68dm5p6s73c2d7rg --confirm

# Watch logs
render logs --resources srv-d75j68dm5p6s73c2d7rg --tail
```

## Frontend Deployment Process (Vercel)

### Deploy from Local (Linked Project)

```bash
# Deploy to production
vercel --yes --prod

# Or for a preview deployment
vercel --yes
```

### Deploy from GitHub (Recommended)

Vercel automatically deploys when you push to the connected GitHub repo.

1. Ensure GitHub repo is connected in Vercel dashboard
2. Push changes to master branch
3. Vercel will auto-deploy (if auto-deploy is enabled) or you can trigger manually

## Verification Checklist

### Backend
- [ ] `GET https://raksha-mvp-backend.onrender.com/health` returns `{"status":"ok"}`
- [ ] `wss://raksha-mvp-backend.onrender.com/ws/live` accepts WebSocket connection
- [ ] Render logs show successful FastAPI startup with Gemini 3.1 model
- [ ] No errors about deprecated model (config.py blocks old models)

### Frontend
- [ ] `https://mithra-kappa.vercel.app` loads without authentication
- [ ] `/dashboard`, `/schedule`, `/select-patient` work on hard refresh
- [ ] `https://mithra-kappa.vercel.app/health` returns backend health via proxy
- [ ] Voice session can start from browser
- [ ] Push-to-talk and assistant audio both work

## Backend Control Commands

Control scripts are available in the repo root:

```bash
# Check backend status
./bstatus srv-d75j68dm5p6s73c2d7rg

# Suspend backend (turn off)
./boff srv-d75j68dm5p6s73c2d7rg

# Resume backend (turn on)
./bon srv-d75j68dm5p6s73c2d7rg
```

## API Endpoints

### Health
- `GET /health` - Returns `{"status": "ok"}`

### Patient Profile
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create new patient

### Schedule
- `GET /api/schedule/today?user_id={}&timezone={}&date={}` - Get today's schedule
- `POST /api/schedule/items/{id}/reports` - Submit adherence report

### Dashboard
- `GET /api/dashboard/{user_id}?timezone={}&date={}` - Get full patient dashboard

### WebSocket
- `ws://host/ws/live?user_id={}&timezone={}` - Live voice session

## Important Notes

1. **GEMINI MODEL**: Must use `gemini-3.1-flash-live-preview` - the old `gemini-2.5-flash-native-audio-preview-12-2025` is deprecated and blocked by config.py validator

2. **WebSocket Direct**: Voice WebSocket connects directly to Render, NOT through Vercel proxy

3. **CORS**: Backend CORS is configured from `FRONTEND_ORIGIN` env var

4. **SQLite**: Uses local SQLite files on Render - acceptable for MVP but not production scale

5. **Free Tier Cold Start**: Render free tier may cold start after inactivity (15+ min)

## Troubleshooting

### Frontend loads but API fails
- Check `vercel.json` rewrites point to correct Render URL
- Verify backend is not suspended (`./bstatus srv-d75j68dm5p6s73c2d7rg`)
- Check `/health` endpoint: `curl https://raksha-mvp-backend.onrender.com/health`

### Voice doesn't connect
- Ensure WebSocket URL is direct to Render (`wss://raksha-mvp-backend.onrender.com`)
- Verify `GEMINI_API_KEY` is set in Render
- Check browser console for WebSocket errors

### Vercel site requires login
- Disable deployment protection in Vercel project settings (Project → Settings → Deployment Protection)

### Backend starts but data looks reset
- Expected on Render free tier (ephemeral storage)
- Long-term: migrate to PostgreSQL or persistent storage

### Build failures with MUI Grid
- MUI v7 changed Grid API: use `size={{ xs: 12, md: 6 }}` instead of `item xs={12} md={6}`
- See fix in commit `04d8479e`

## Files That Make Production Work

- `render.yaml` - Render blueprint with all service config
- `vercel.json` (root) - Vercel build config with backend rewrites
- `front end/vercel.json` - Alternative frontend-only config
- `back end/.env.example` - Template for local dev
- `front end/.env.example` - Template for local dev
- `scripts/backend-control` - Backend control helper script

## Quick Reference

- **Repo**: https://github.com/bezaspace/mithra-development.git
- **Backend**: https://raksha-mvp-backend.onrender.com (srv-d75j68dm5p6s73c2d7rg)
- **Frontend**: https://mithra-kappa.vercel.app
- **Health**: https://raksha-mvp-backend.onrender.com/health
- **WebSocket**: wss://raksha-mvp-backend.onrender.com/ws/live

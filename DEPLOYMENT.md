# Mithra Deployment Guide

This document is the current deployment reference for this repo. Older deployment details from the previous app version have been removed.

## Current Scope

- GitHub repo: `https://github.com/bezaspace/mithra.git`
- Backend host: Render
- Frontend host: Vercel
- Backend root: `back end/`
- Primary backend config: `render.yaml`
- Primary Vercel config (monorepo root): `vercel.json`

This repo is now deployed as a split setup:

- backend on Render
- frontend on Vercel

## Backend Architecture

The backend is a FastAPI service that currently exposes:

- `GET /health`
- `WS /ws/live`
- `GET /api/dashboard/{user_id}`
- schedule APIs under `/api/schedule`

The entrypoint is `app.main:app` in `back end/app/main.py`.

## Render Configuration

The Render blueprint lives at `render.yaml` and is currently aligned to this repo:

- repo: `https://github.com/bezaspace/mithra.git`
- root directory: `back end`
- runtime: Python
- build command: `pip install uv && uv sync --frozen`
- start command: `.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- health check path: `/health`

The blueprint intentionally keeps `GEMINI_API_KEY` as a Render-managed secret with `sync: false`.

## Required Backend Environment Variables

Set these in Render before expecting the backend to work correctly:

- `GEMINI_API_KEY` - required secret
- `FRONTEND_ORIGIN` - browser origin allowed by FastAPI CORS

Also configured in `render.yaml`:

- `PYTHON_VERSION=3.11.11`
- `APP_NAME=raksha`
- `GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025`
- `LOG_LEVEL=info`

The backend also supports these database-related values through `back end/app/config.py`:

- `PROFILE_DB_URL`
- `PROFILE_SEED_SQL_PATH`
- `SCHEDULE_DB_URL`
- `SCHEDULE_SEED_SQL_PATH`

If you do not override them, the app uses the defaults defined in code.

## Render Deployment Flow

### 1. Confirm the backend repo target

Render should deploy from:

- `https://github.com/bezaspace/mithra.git`

Do not use the old `rak4` repo.

### 2. Create or update the Render web service

Use the Render CLI with the current workspace selected.

Typical service settings:

- type: web service
- repo: `https://github.com/bezaspace/mithra.git`
- root directory: `back end`
- runtime: `python`
- region: your preferred Render region
- plan: your preferred Render plan

If you create the service with CLI flags instead of the blueprint UI, keep the commands exactly aligned with `render.yaml`.

### 3. Set environment variables in Render

At minimum, set:

- `GEMINI_API_KEY`
- `FRONTEND_ORIGIN`

Recommended: also mirror the non-secret values from `render.yaml` unless you have a reason to override them.

### 4. Deploy from GitHub through Render

Once the service exists and points at `bezaspace/mithra`, trigger a deploy from the connected GitHub repo.

Important: Render deploys from GitHub commits, not your local uncommitted changes.
If you fix code locally but do not push, Render will still build the previous commit and the fix will not be included.

Useful CLI commands:

```bash
render workspace current --output json
render services --output json
render deploys create <service-id> --wait
```

### 5. Verify the deployment

After the deploy finishes, verify:

- `https://<your-render-service>.onrender.com/health` returns `{"status":"ok"}`
- `wss://<your-render-service>.onrender.com/ws/live` accepts a WebSocket connection
- Render logs show successful FastAPI startup

## Standard Change-to-Prod Pipeline (Follow Every Time)

Use this exact sequence for backend changes.

### 1. Fix and verify locally

Make the backend fix in `back end/` and run at least one quick import/start sanity check before pushing.

Example sanity check:

```bash
uv run python -c "import app.main; print('backend import ok')"
```

### 2. Commit only the required backend change

Keep the commit focused so deployment rollback and debugging stay simple.

```bash
git add "back end/<changed-file>.py"
git commit -m "fix <short backend issue description>"
```

### 3. Push to GitHub main

```bash
git push origin main
```

### 4. Redeploy Render from the pushed commit

Trigger a deploy on the Render service after the push completes.

```bash
render deploys create <service-id> --wait --confirm
```

Optional: pin deploy to a specific commit.

```bash
render deploys create <service-id> --commit <git-sha> --wait --confirm
```

### 5. Validate with curl + logs

Run functional checks from your machine:

```bash
curl -i "https://<your-render-service>.onrender.com/health"
curl -i "https://<your-render-service>.onrender.com/api/schedule/today?user_id=raksha-user"
render logs --resources <service-id> --limit 40 --output text
```

If health fails, always inspect Render logs first to identify startup/import/runtime errors.

## Current Service Reference (This Deployment)

- Render service name: `mithra-backend`
- Render service id: `srv-d6sgl1chg0os73f6nsl0`
- Render URL: `https://mithra-backend-0f0r.onrender.com`
- Latest known successful deploy commit: `9745fe4b78883757bf081c858280c591f73717ad`

Keep these values updated whenever the service is recreated or renamed.

## Frontend Deployment Reference (Vercel)

- Vercel scope/team: `bezaspaces-projects`
- Vercel project name: `mithra-fresh`
- Production alias: `https://mithra-fresh.vercel.app`
- Git integration: connected to `https://github.com/bezaspace/mithra`
- Current monorepo build config source: root `vercel.json`

Frontend deploy behavior for this project:

- Deployments are triggered from GitHub commits on `main`.
- Vercel project root is repo root (`.`), and root `vercel.json` runs frontend build from `front end/`.
- HTTP requests to `/api/*` and `/health` on Vercel are rewritten to `https://mithra-backend-0f0r.onrender.com`.
- WebSocket remains direct to Render via `VITE_BACKEND_WS_URL`.

### Frontend change pipeline (GitHub -> Vercel)

Use this sequence for frontend changes:

```bash
bun run build --cwd "front end"
git add "front end/<changed-files>" vercel.json
git commit -m "update frontend <short description>"
git push origin main
vercel list mithra-fresh --scope bezaspaces-projects
curl -i "https://mithra-fresh.vercel.app/health"
```

Expected verification:

- `https://mithra-fresh.vercel.app` loads the app shell
- `https://mithra-fresh.vercel.app/health` returns backend health JSON
- dashboard API calls on Vercel domain return `200`

## Frontend Integration References

These files still matter because the frontend expects to talk to the deployed backend:

- `vercel.json` (repo root, used by Vercel project)
- `front end/vercel.json`
- `front end/src/lib/backendUrls.ts`

Current expectations:

- root `vercel.json` is the active config for the current Vercel project and currently rewrites HTTP to `https://mithra-backend-0f0r.onrender.com`.
- `front end/vercel.json` mirrors equivalent rewrite/build settings for the frontend directory and should be kept aligned for consistency.
- `front end/src/lib/backendUrls.ts` prefers `VITE_BACKEND_WS_URL` in production. Keep it set to `wss://mithra-backend-0f0r.onrender.com/ws/live`.

## Backend Control Helpers

The repo includes:

- `./boff`
- `./bon`
- `./bstatus`

These wrappers call `scripts/backend-control`.

Because this repo should no longer hardcode an old Render service, you must provide the current backend service id when using them.

Examples:

```bash
RENDER_BACKEND_SERVICE_ID=srv-xxxx ./bstatus
RENDER_BACKEND_SERVICE_ID=srv-xxxx ./boff
RENDER_BACKEND_SERVICE_ID=srv-xxxx ./bon
```

You can also pass the service id directly:

```bash
scripts/backend-control status srv-xxxx
```

## Notes and Caveats

- Render free services may cold start after inactivity.
- The backend currently uses local SQLite-backed files under `back end/app/data`, so persistence is still MVP-grade rather than production-grade.
- `FRONTEND_ORIGIN` must match the browser origin you actually use, otherwise CORS will fail.
- Keep secrets only in local `.env` files and hosting platform secrets, never in git.

## Quick Reference

- Repo: `https://github.com/bezaspace/mithra.git`
- Backend root: `back end/`
- Render config: `render.yaml`
- Backend entrypoint: `back end/app/main.py`
- Frontend rewrite config: `front end/vercel.json`
- Backend control helper: `scripts/backend-control`

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Chat Note — a full-stack app for aggregating LLM chats and converting conversations into structured notes. Backend is Go/Gin, frontend is Next.js 16/React 19.

**IMPORTANT:** This project uses Next.js 16.2, which has breaking changes from earlier versions. Before writing frontend code, read the relevant guides in `frontend/node_modules/next/dist/docs/`.

## Common Commands

### Backend (`/backend`)

```bash
make run          # Run server on :8080
make dev          # Hot reload (requires air)
make test         # Run all Go tests
make test -v      # Verbose test output
make coverage     # Tests with HTML coverage report
make lint         # golangci-lint
make fmt          # go fmt
make docker-up    # Start PostgreSQL + backend via Docker Compose
make docker-down  # Stop Docker services
```

Run a single test: `go test -v -run TestFunctionName ./internal/package/...`

### Frontend (`/frontend`)

```bash
npm run dev       # Next.js dev server on :3000
npm run build     # Production build
npm run lint      # ESLint
```

### Prerequisites

- PostgreSQL 15+ running (config in `backend/config.yaml`, defaults in `backend/docker-compose.yml`)
- Backend serves on `localhost:8080`, frontend on `localhost:3000`
- Frontend proxies streaming chat via Next.js API route at `/api/chat/stream`

## Architecture

### Backend (`/backend`)

Classic layered architecture: **Handlers** → **Services** → **Repository** → **Models** (GORM).

- `cmd/server/main.go` — Entry point, router setup, dependency injection
- `internal/handlers/` — HTTP handlers per domain (auth, conversation, note, provider, etc.)
- `internal/services/` — Business logic (AI integration, email, OAuth, summary, verification)
- `internal/repository/` — Data access layer
- `internal/models/` — GORM model definitions (18 models)
- `internal/middleware/` — Auth (JWT), CORS, recovery, logging
- `internal/config/` — YAML config loading with env var overrides
- `internal/crypto/` — AES-256 encryption for API keys, JWT, password hashing
- `migrations/` — 10 numbered SQL migration files

API routes are all under `/api/` and defined in `cmd/server/main.go`. Public routes: auth register/login/refresh/email. All other routes require JWT auth.

### Frontend (`/frontend`)

Next.js App Router with route groups:

- `src/app/(auth)/` — Login, register, OAuth callback pages
- `src/app/(main)/` — Main app pages (chat, notes, models, settings, etc.)
- `src/app/api/chat/stream/route.ts` — SSE streaming proxy to backend

Key directories:
- `src/components/` — Organized by domain: `chat/`, `notes/`, `auth/`, `provider-management/`, `notifications/`, `layout/`, `ui/` (shadcn/ui)
- `src/hooks/` — Custom React hooks wrapping TanStack React Query (use-conversations, use-stream-chat, use-providers, etc.)
- `src/lib/api/` — Axios client modules with JWT interceptor (`client.ts`)
- `src/stores/` — Zustand stores (auth, chat, notes, ui)
- `src/i18n/` + `src/messages/` — Custom i18n (zh/en)
- `src/types/` — TypeScript type definitions

### Data Flow

1. Frontend Axios client (`src/lib/api/client.ts`) sends requests to backend with JWT interceptor
2. Backend middleware validates JWT, routes to handler → service → repository → GORM/PostgreSQL
3. Streaming chat: Frontend → Next.js API route (`/api/chat/stream`) → SSE to backend → LLM provider
4. AI title generation and conversation summarization use DeepSeek API via OpenAI-compatible client

### Database

PostgreSQL 15+ with 10 migrations. Core entities: users, providers (LLM configs with encrypted API keys), provider_models, conversations, messages, notes (with tsvector full-text search), folders, tags, notifications, oauth_accounts.

## Code Style

### Frontend (from `.prettierrc`)
- No semicolons, single quotes, 2-space indent, 100 char line width, trailing commas (es5)
- Uses shadcn/ui components (base-nova style) — check `frontend/components.json`
- Path alias: `@/*` maps to `src/*`

### Backend
- Go standard formatting (`go fmt`)
- Uses Gin context for request/response handling
- GORM for database operations with auto-migration
- Tests use SQLite for isolation (`github.com/glebarez/sqlite`) + testify assertions

## Key Configuration

- `backend/config.yaml` — DB, JWT, CORS, AI, SMTP, OAuth, context processing settings
- `backend/.env.example` — Environment variable overrides
- `frontend/.env.example` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEBUG`
- Mock mode available (`mock.enabled: true` in config.yaml) for testing without LLM API keys

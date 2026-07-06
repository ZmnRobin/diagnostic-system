# Sachar Diagnostic Center Management System

A clean, fast web application for running a small single-branch diagnostic centre.
Runs entirely on your local network — no cloud, no internet needed for daily use.

> **Status:** Phase 1 — Foundation & Daily Workflow Skeleton.
> Phase 2 (Lab + PDF Reports) and Phase 3 (Finance & Admin) are scoped in `/docs/plan.md`.

---

## Daily workflow supported today

1. Reception registers a patient (search or create new).
2. Reception selects diagnostic tests and confirms payment.
3. Income is recorded automatically.
4. Lab sees pending tests on the lab dashboard.
5. Admin sees today's income, expenses, profit, and recent activity.

Printable invoice layout is built-in. PDF lab reports come in Phase 2.

---

## Default login accounts (after seeding)

| Username   | Password      | Role      |
|------------|---------------|-----------|
| `admin`    | `admin123`    | ADMIN     |
| `reception`| `reception123`| RECEPTION |
| `lab`      | `lab123`      | LAB       |

**Change these immediately on first deployment.**

---

## First-time setup (development)

Requires **Node.js 20+** and either a local PostgreSQL or Docker.

### Option A — Docker (recommended for dev)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Copy environment template
cp .env.example .env
# Edit JWT_SECRET — generate one: openssl rand -base64 32

# 3. Install + migrate + seed
npm install
npm run db:migrate
npm run db:seed

# 4. Start the app
npm run dev
```

Visit `http://localhost:3000` and sign in.

### Option B — Existing PostgreSQL

```bash
# Set DATABASE_URL in .env to your postgres instance, e.g.:
# DATABASE_URL="postgresql://user:pass@localhost:5432/sachar_medical"

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

---

## LAN deployment (the real target — Mini PC + 3 client PCs)

This system is designed to run on one Mini PC inside the diagnostic centre
with three client computers connecting through the same LAN.

### On the Mini PC (the server)

1. Install Node.js 20+ and PostgreSQL 16.
2. Clone the repository into `C:\sachar\` (or wherever you prefer).
3. Configure `.env`:
   - `DATABASE_URL` pointing at your local Postgres.
   - `JWT_SECRET` set to a long random string.
4. `npm install && npm run db:migrate && npm run db:seed`.
5. Build & start in production mode:

   ```bash
   npm run build
   npm start
   ```

   This runs on `http://<mini-pc-ip>:3000`. Find the Mini PC's IP via `ipconfig`
   (look for IPv4 Address — typically `192.168.x.y`).

6. Optional: keep it running across reboots with **pm2**:

   ```bash
   npm install -g pm2
   pm2 start npm --name sachar -- start
   pm2 save
   pm2 startup   # follow the printed command
   ```

### On each client PC

Open a browser and visit `http://<mini-pc-ip>:3000`. No client installation.

> Tip: pin this URL to a desktop shortcut on each client PC for one-click access.

---

## Daily backup (critical — this is your medical record database)

Set up a daily `pg_dump` via **Task Scheduler** (Windows) or cron:

```bat
@echo off
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -d sachar_medical -F c -f "D:\backups\sachar_%date:~-4%%date:~3,2%%date:~0,2%.dump"
```

Run this nightly at e.g. 23:00. Store D:\backups\ on a USB drive or external disk,
rotated weekly.

In Phase 3 the admin dashboard will surface a banner reminding you when no
backup has been recorded in 24h.

---

## Architecture

```
Next.js (App Router, TypeScript)
  └─ Route Handlers (src/app/api/**/route.ts)        ← thin controllers
       └─ Services (src/server/services/*.ts)        ← business logic
            └─ Repositories (src/server/repositories/*.ts)
                 └─ Prisma Client (PostgreSQL)
```

**Strict layering:** business logic never lives in route handlers. Services
orchestrate; repositories only access data.

---

## Project layout

```
prisma/
  schema.prisma            # Data model
  seed.ts                  # Users + tests + center settings
src/
  app/                     # Pages + API route handlers
  components/              # UI primitives + shared components
  hooks/                   # Custom React hooks
  lib/                     # API client, query provider, Zod validators
  server/
    auth/                  # JWT cookie session, RBAC, password hashing
    db.ts                  # Prisma client singleton
    pdf/                   # (Phase 2) PDF templates
    repositories/          # Data-access layer
    services/              # Business logic layer
    utils/                 # ID generators, money, date helpers
  stores/                  # Zustand stores (invoice draft)
  types/                   # Shared domain types
```

---

## Scripts

| Command                  | Purpose                          |
|--------------------------|----------------------------------|
| `npm run dev`            | Dev server (hot reload)          |
| `npm run build`          | Production build                 |
| `npm start`              | Run production build             |
| `npm run typecheck`      | TypeScript validation            |
| `npm run db:migrate`     | Create / run a migration         |
| `npm run db:push`        | Push schema without a migration  |
| `npm run db:seed`        | Insert seed data                 |
| `npm run db:studio`      | Open Prisma Studio               |

---

## Roadmap

- **Phase 2** — Lab result entry, draft → approve state machine, PDF reports.
- **Phase 3** — Expense & manual-income CRUD, cash book, financial reports,
  full admin dashboard, user management, backup reminder.# diagnostic-system

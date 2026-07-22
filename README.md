# WrectifAI — Handover Documentation

Welcome to the **WrectifAI** workspace. This repository is structured as an **Nx Monorepo** containing the backend API, next-generation web portal, and Expo-based mobile app. 

This document serves as a comprehensive handover guide for the incoming senior developer, detailing the architecture, local setup, implementation status, and core platform guidelines.

### Quick Links
- 📘 **[Developer Guide](file:///c:/Users/vishn/PROJECT/wrectifai/DEVELOPER_GUIDE.md)**: Deep-dive into coding rules, Express modules structure, database queries, and test setups.
- ⚙️ **[.env.example](file:///c:/Users/vishn/PROJECT/wrectifai/.env.example)**: Example environment configuration template.


---

## 🗺️ Project Structure & Tech Stack

WrectifAI is organized into feature-centric layers managed by [Nx](https://nx.dev).

```
wrectifai/
├── apps/
│   ├── api/               # Node.js v22 (CommonJS bundled via Nx & esbuild) + Express + PostgreSQL
│   ├── web/               # Next.js web portal
│   └── mobile/            # Expo React Native mobile app
├── db/
│   └── migrations/        # Database migrations (Raw SQL)
├── Docs/
│   ├── solutions/         # Solution designs and architecture logs
│   ├── ARCHITECTURE.md    # High-level system & component architecture
│   ├── DATA_API.md        # API contracts & Role-Based Access Control (RBAC) matrix
│   ├── schema.md          # Database schema design & constraints
│   ├── SPRINT.md          # Full-stack integration roadmap and progress
│   └── SPEC.md            # Product & engineering specification
└── AGENTS.md              # Mandatory developer constraints and coding rules
```

### Core Technologies
- **Monorepo Manager**: Nx (task caching, build optimization)
- **Backend**: Node.js v22 (Express, TypeScript)
- **Database**: PostgreSQL (raw query pool, no ORM)
- **Frontend**: Next.js (Web), React Native / Expo (Mobile)
- **Styling**: Vanilla CSS / Tailwind (where requested)
- **AI/LLM**: Vercel AI SDK integration, Groq (Llama, Whisper), OpenAI (fallback)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v22.x` (or newer)
- **Docker**: For running the PostgreSQL instance
- **Package Manager**: `pnpm` (configured workspace)

### 2. Environment Setup
Clone the example configuration to your local environment file:
```sh
cp .env.example .env
```
Ensure database credentials, `GROQ_API_KEY`, and optional `OPENAI_API_KEY` are configured.

### 3. Running Database & Migrations
Spawn the database container:
```sh
pnpm db:up
```
This launches a PostgreSQL container configured with auto-migration. If you need to reset the database and its seed data:
```sh
pnpm db:reset
```

### 4. Running the Applications
Start the developer servers concurrently or individually using Nx:

* **Backend API**:
  ```sh
  pnpm api
  # Runs: nx serve api
  ```
* **Web Portal**:
  ```sh
  pnpm web
  # Runs: nx dev web
  ```
* **Mobile App**:
  ```sh
  pnpm mobile
  # Runs: nx start mobile
  ```

### 5. Running Tests
Execute test suites across the workspace:
* **All Tests**: `pnpm test`
* **API Unit Tests**: `pnpm test:api:unit`
* **API Integration Tests**: `pnpm test:api`

---

## 📈 Implementation Status & Sprint Progress

The roadmap is structured into vertical feature slices (from database schema, API integration to UI components). Refer to [Docs/SPRINT.md](file:///c:/Users/vishn/PROJECT/wrectifai/Docs/SPRINT.md) for detailed tasks.

| Sprint | Description | Status | Key Deliverables |
|---|---|---|---|
| **Sprint 0** | Core API & DB Pool | **Completed** | Express framework setup, JWT utilities, pg-pool configuration, global error handling. |
| **Sprint 0.5** | Frontend Foundation | **Completed** | API Client setup, global auth-guard/context, basic route skeleton. |
| **Sprint 1** | Auth & RBAC Guarding | **Completed** | Auth middleware, standard response envelope helpers, role claims parsing. |
| **Sprint 2** | Vehicle Management | **Completed** | Vehicle CRUD APIs, database schemas, frontend vehicle-selector component with auto-selection. |
| **Sprint 3** | AI Diagnosis Engine | **Completed** | Multimodal intake flow (Image & Audio pre-processing), RAG grounding via PostgreSQL Full-Text Search (FTS), zero-match bypass, safety guardrail post-processor. |
| **Sprint 4-9** | Bookings, Quotes, Marketplace | *Pending* | Payment Adapters (Stripe), Quotes flow, parts orders, review verification, notification service. |

---

## 🧠 Highlighted Feature: AI Diagnosis Engine

The most complex system implemented is the **AI Diagnosis Engine**, a two-stage, RAG-grounded diagnostic pipeline.

1. **Stage 1 (Questions)**: Generates 3–5 targeted questions based on Postgres FTS matching against the `known_issues` database (returns early/bypasses LLM cost if zero matches are found).
2. **Stage 2 (Final Diagnosis)**: Analyzes user intake answers, processes any attached images (via `llama-4-scout` on Groq Vision API), transcribes audio (via `whisper-large-v3-turbo` using raw node fetch to match OpenAI multi-part schemas), performs final LLM evaluation, applies safety guardrails, and commits request/result records to database transactionally.

For the detailed end-to-end design, flowcharts, schemas, and API responses, read [2026-07-06-ai-diagnosis-architecture.md](file:///c:/Users/vishn/PROJECT/wrectifai/Docs/solutions/2026-07-06-ai-diagnosis-architecture.md).

---

## 🛠️ Mandatory Coding & Platform Rules (For Assistants/Devs)

To maintain consistency and security, all modifications to the backend must strictly follow [AGENTS.md](file:///c:/Users/vishn/PROJECT/wrectifai/AGENTS.md):

* **Database Access**: Do **NOT** use ORMs (Prisma, Drizzle, etc.). All DB interaction must use raw SQL parameterized queries via the helper exported from [database.ts](file:///c:/Users/vishn/PROJECT/wrectifai/apps/api/src/config/database.ts).
* **Security & RBAC**: Standardize authorization via the `authenticate` middleware. Check roles against the junction table `user_roles` using `requireRole(['user', 'garage', 'vendor', 'admin'])`.
* **API Versioning**: Mount all HTTP routes under `/api/v1` in [routes/index.ts](file:///c:/Users/vishn/PROJECT/wrectifai/apps/api/src/routes/index.ts).
* **Response Helpers**:
  - Success responses must use: `success(res, data, statusCode, meta?)`
  - Error responses must use: `error(res, message, errorCode, statusCode, details?)`
* **UI Reusability**: All shared UI components and primitives (Buttons, Modals, Badges) must reside in `/components/common/` to prevent duplication.

---

## 📬 Handover Notes for Next Steps

1. **Uncommitted/Staged Changes**: We are currently on branch `feat/api_integration`. There are staged changes enhancing auth role-mapping middleware, typed Express requests (`apps/api/src/types/express.d.ts`), and the web vehicle-selector. Review the changes with `git diff --staged` before checking them in.
2. **Pending Sprint**: Prepare for **Sprint 4 (Garage Discovery & Onboarding)**. Setup the maps provider adapter and geocoding services.
3. **Database Schema**: Verify indexes and tables listed under `Docs/schema.md` when proposing schema migrations. Always write matching down-migrations.

For deep-dive topics, please refer to the markdown files in the [Docs](file:///c:/Users/vishn/PROJECT/wrectifai/Docs) directory.


# SPRINT.md — Full-Stack Integration Plan for WRECTIFAI

**Created**: 2026-07-03
**Updated**: 2026-07-03
**Goal**: Replace all hardcoded frontend data with live API calls. Each sprint delivers a working vertical slice: backend API + frontend integration + tests.

---

## Current State Assessment

### What Exists
| Layer | Status |
|-------|--------|
| PostgreSQL Schema | 20 tables migrated (`db/migrations/001_initial_schema.sql`) |
| API (Express) | **Sprint 0 done** — DB pool, JWT, auth middleware, response helpers, route skeletons |
| Web (Next.js) | 15+ pages built, **all data hardcoded**, **zero API calls** |
| Mobile (Expo/RN) | Minimal — home screen + navigation shell |
| Docker Compose | PostgreSQL configured with auto-migration |
| Frontend API Client | **Does not exist** |
| State Management | `useState` only — no shared state, no context providers |

### Sprint 0 Completed (2026-07-03)
- `apps/api/src/config/database.ts` — PostgreSQL connection pool via `pg`
- `apps/api/src/utils/response.ts` — `success()` / `error()` envelope
- `apps/api/src/services/jwt.service.ts` — access + refresh token signing/verification
- `apps/api/src/middleware/auth.ts` — `authenticate` + `requireRole`
- `apps/api/src/middleware/request-logger.ts` — request logging
- `apps/api/src/middleware/error-handler.ts` — global error handler
- Domain router skeletons (vehicles, diagnosis, garages, quotes, bookings, marketplace, payments, reviews, admin)
- `apps/api/src/routes/index.ts` — all modules mounted under `/api/v1`

### What's Hardcoded (Frontend)
| Page | File | Hardcoded Data |
|------|------|----------------|
| Home Dashboard | `data.tsx` | navItems, categoryItems, maintenanceItems, garages[], seasonalDeals[], careTips[], overviewItems[], emergencyItems[], promoItems[] |
| Garage Listing | `garages-page.tsx` | 12 garage objects with ratings, distances, chips |
| Quotes | `quotes-page.tsx` | quotesList[], aiEstimatedQuoteRange, quoteContextDefaultIssueIds (from `quotes-shared.ts`) |
| Deals & Offers | `deals-page.tsx` | 18 deal items duplicated x3 for pagination |
| AI Diagnosis | `ai-diagnose-page.tsx` | legacyResultIssues[], legacyResultSummaryItems[], resultNextSteps[], analyzing steps |
| Diagnosis Config | `issue-intake-config.ts` | 6 issue categories, 24 questions, 18 possible issue results |
| Diagnosis Flow | `diagnose-flow-shared.tsx` | resultIssues[] shared across pages |

---

## Testing Strategy

### Principles
1. **Test the foundation first** — JWT and auth are the highest-risk code
2. **One integration test per feature** — prove the full stack works
3. **No test framework yet** — use `vitest` for backend (fast, ESM-native, Jest-compatible API)
4. **No frontend tests until Sprint 3** — UI changes too fast during integration

### What to Test Per Sprint

| Sprint | Must Test | Should Test | Skip |
|--------|-----------|-------------|------|
| 0.5 | API client (unit) | Auth hook (unit) | — |
| 1 | JWT sign/verify, auth middleware, RBAC | Login flow (integration) | Frontend UI |
| 2 | Vehicle CRUD (integration), permission checks | Vehicle selector component | — |
| 3 | Diagnosis submission (integration), LLM prompt/output | Media upload | — |
| 4 | Garage search (integration), geo-distance | Onboarding flow | — |
| 5 | Quote lifecycle (integration), status transitions | — | — |
| 6 | Booking status machine (integration), payment webhook | Stripe integration | — |
| 7 | Cart + inventory (integration), order flow | — | — |
| 8 | Badge recompute, admin moderation | — | — |
| 9 | Notification dispatch | — | End-to-end flow |

### Test File Locations
```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── auth.service.test.ts
│   │   └── auth.routes.test.ts
│   ├── vehicles/
│   │   ├── vehicles.service.test.ts
│   │   └── vehicles.routes.test.ts
│   └── ...
└── middleware/
    ├── auth.test.ts
    └── role-check.test.ts

apps/web/src/
├── lib/
│   └── api-client.test.ts      (from Sprint 0.5)
```

---

## Sprint Plan

### Sprint 0 — Foundation (API skeleton + DB connection) [DONE]
**Status**: COMPLETED (2026-07-03)
**Duration**: 2 days

- [x] PostgreSQL connection pool (`pg.Pool`)
- [x] `database.ts` with connection string from env
- [x] `modules/` folder structure per domain
- [x] Middleware stack: CORS, body-parser, error-handler, request-logger
- [x] JWT infrastructure: token generation, verification, refresh tokens
- [x] Response helpers (`success()`, `error()` envelope per DATA_API.md)
- [x] Docker Compose verified with PostgreSQL + migrations

**Deliverable**: API boots, connects to DB, returns `{ data }` envelope.

---

### Sprint 0.5 — Authentication Refactor (OTP + OAuth stubs, dedicated routes) [DONE]
**Duration**: 1 day
**Depends on**: Sprint 0

#### Backend
- [x] Migrated auth from email/password to phone number OTP (`+919876543210`, `9876543210`)
- [x] Hardcoded OTP validation against `123456`
- [x] Stubbed Google & Apple OAuth handlers
- [x] Removed email/password registration/login code and mock hashes

#### Frontend Integration
- [x] Create `apps/web/src/lib/api-client.ts`
  - Base URL from `NEXT_PUBLIC_API_URL` env var
  - Automatic `Authorization: Bearer <token>` header injection
  - Token refresh on 401 response (silent retry)
  - Response envelope unwrapping (extract `data` from `{ data }`)
  - Error normalization (extract `error` from `{ error }`)
  - Request/response interceptors for logging
- [x] Update `apps/web/.env` — set `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`
- [x] Create `apps/web/src/lib/auth-context.tsx`
  - `AuthProvider` with `user`, `token`, `isAuthenticated` state
  - `login(token)` / `logout()` methods
  - Persist tokens to `localStorage` (accessible to api-client)
  - Auto-load user from stored token on app mount
- [x] Wrap app root in `<AuthProvider>`
- [x] Update `TopNavbar` to consume auth context — removed modal, "Log In" button links to `/login`
- [x] Created dedicated `/login` page (`apps/web/src/app/login/page.tsx`)
- [x] Created dedicated `/signup` page (`apps/web/src/app/signup/page.tsx`)
  - Phone entry + 6-digit OTP input stages
  - Google & Apple OAuth stub buttons
  - Responsive Tailwind CSS styling matching app theme
  - Removed "Back to Home" buttons and "Demo Mode Alert Banners"

#### Tests
- [x] `apps/web/src/lib/api-client.test.ts` — unit tests for:
  - Base URL construction
  - Auth header injection
  - Response envelope unwrapping
  - Error normalization
  - 401 retry logic
- [x] All 5 tests passed via `npx nx test web`
- [x] ESLint clean on `auth.routes.ts` — all warnings/errors resolved

**Deliverable**: Phone OTP + OAuth stubs auth system; dedicated login/signup routes; frontend API client and auth context working.

---

### Sprint 1 — Auth + RBAC (Google OAuth Only) [DONE]
**Duration**: 3-4 days
**Depends on**: Sprint 0.5
**API Endpoints**: §1 of DATA_API.md

#### Backend
- [x] `POST /auth/google` — verify Google ID token → login/register, issue JWT access + refresh tokens
- [x] `POST /auth/refresh` — rotate access token
- [x] `POST /auth/logout` — invalidate refresh token
- [x] Auth middleware: extract user + roles from JWT, attach to `req.user`
- [x] Role-check middleware: verify `user_roles` mapping (not profile inference)
- [x] Seed default roles on first run (already in migration)

#### Frontend Integration
- [x] Integrate Google Login button (`@react-oauth/google`) → `POST /auth/google`
- [x] Store tokens via auth context (`login()` method)
- [x] Wire TopNavbar to show logged-in user from JWT payload
- [x] Protect routes: redirect to login if unauthenticated
- [x] Handle token expiry: auto-refresh or redirect to login

#### Tests
- [x] `apps/api/src/middleware/auth.test.ts` — unit tests for:
  - Valid token → `req.user` populated
  - Missing token → 401
  - Expired token → 401
  - Invalid signature → 401
- [x] `apps/api/src/modules/auth/auth.service.test.ts` — unit tests for:
  - JWT sign/verify roundtrip
  - Token expiry (access 15m, refresh 7d)
  - Refresh token rotation
- [x] `apps/api/src/modules/auth/auth.routes.test.ts` — integration test:
  - POST /auth/google with mock Google token → user created + tokens returned
  - POST /auth/refresh with valid refresh → new access token
  - POST /auth/logout → refresh token invalidated

**Deliverable**: Users can register, login, and hit protected routes. Auth flow works end-to-end.

---

### Sprint 2 — Vehicle Management [DONE]
**Duration**: 2-3 days
**Depends on**: Sprint 1
**API Endpoints**: §2 of DATA_API.md

#### Backend
- [x] `GET /vehicles` — list customer's vehicles
- [x] `POST /vehicles` — add vehicle
- [x] `GET /vehicles/:vehicleId` — get single vehicle
- [x] `PATCH /vehicles/:vehicleId` — update vehicle
- [x] `DELETE /vehicles/:vehicleId` — soft/hard delete
- [x] Permission: only owner can modify their vehicle

#### Frontend Integration
- [x] Create `apps/web/src/pages/vehicles/` — vehicles list page
  - Fetch `GET /vehicles` on mount
  - Loading skeleton, error state, empty state
  - Add vehicle modal/form
  - Edit/delete with confirmation
- [x] Create `apps/web/src/components/common/vehicle-selector.tsx`
  - Dropdown/popover showing user's vehicles
  - Select vehicle → returns vehicle ID
  - Used by diagnosis and quotes pages
- [x] Replace hardcoded "Honda City (TS07 AB 1234)" in:
  - `apps/web/src/pages/quotes/quotes-page.tsx:535`
  - `apps/web/src/pages/ai-diagnose/ai-diagnose-page.tsx:979`
- [x] Wire vehicle selector into diagnosis flow and quote request form

#### Tests
- [x] `apps/api/src/modules/vehicles/vehicles.service.test.ts` — integration test:
  - CRUD operations (create, read, update, delete)
  - Permission: owner can modify, other user cannot
  - Soft delete: vehicle marked inactive, not returned in list
- [x] `apps/api/src/modules/vehicles/vehicles.routes.test.ts` — integration test:
  - GET /vehicles with auth → returns user's vehicles
  - POST /vehicles with auth → vehicle created
  - PATCH /vehicles/:id by owner → updated
  - PATCH /vehicles/:id by other user → 403
  - DELETE /vehicles/:id → soft deleted

**Deliverable**: Users can manage vehicles; diagnosis/quotes reference real vehicle data.

---

### Sprint 3 — AI Diagnosis Engine [DONE]
**Duration**: 4-5 days
**Depends on**: Sprint 2
**API Endpoints**: §3 of DATA_API.md

#### Backend
- [x] `POST /diagnosis` — submit symptoms + media → create diagnosis request
- [x] `GET /diagnosis/:diagnosisId` — fetch results
- [x] `GET /diagnosis/:diagnosisId/recommendations` — get DIY/garage recommendations
- [x] Media upload handling (image/video/audio → storage + `diagnosis_media` table)
- [x] LLM integration: send symptoms + vehicle history → structured diagnosis output
- [x] Confidence scoring, risk level classification, DIY safety gate
- [x] Persist results to `diagnosis_results` table

#### Frontend Integration
- [x] Create `apps/web/src/lib/diagnosis-api.ts` — diagnosis-specific API calls
- [x] Replace `issue-intake-config.ts` hardcoded categories with API-driven flow (or keep as prompt templates sent to backend)
- [x] Replace `legacyResultIssues[]` in `ai-diagnose-page.tsx` with API response
- [x] Replace hardcoded "Honda City" in results screen with actual vehicle from selector
- [x] Wire media upload tabs (Photo/Video/Audio) to actual upload endpoint
- [x] Replace hardcoded confidence gauge (92%) with real `confidence_score`
- [x] Wire "Request Quotes" button to create a `quote_request`

#### Tests
- [x] `apps/api/src/modules/diagnosis/diagnosis.service.test.ts` — integration test:
  - Submit diagnosis → results returned with confidence score
  - Media upload → stored and linked to diagnosis
  - Vehicle history context included in LLM prompt
- [x] `apps/api/src/modules/diagnosis/diagnosis.routes.test.ts` — integration test:
  - POST /diagnosis with auth + vehicle → diagnosis created
  - GET /diagnosis/:id → results with recommendations
  - GET /diagnosis/:id without auth → 401

**Deliverable**: Users submit symptoms, get AI-powered diagnosis with real vehicle, can request quotes.

---

### Sprint 4 — Garage Discovery & Deals Integration (Global Data) [DONE]
**Duration**: 3-4 days
**Depends on**: Sprint 3
**API Endpoints**: §4 + §9 of DATA_API.md

#### Backend
- [ ] `GET /garages` — list all garages (including featured ones)
- [ ] `GET /garages/:garageId` — fetch public profile & services
- [ ] `GET /promos` — fetch active deals, offers, and promotions
- [ ] Database migration/seed: populate garages, services, and offers/promos tables.

#### Frontend Integration
- [ ] `apps/web/src/lib/garages-api.ts` — garage & promos API client helper
- [ ] Front Page & Home Dashboard (`http://localhost:3001/`):
  - Replace all hardcoded front page dashboard data (featured garages, offers/promotions, categories, maintenance items, seasonal deals, care tips) with database-driven API responses.
- [ ] Garages List Page:
  - Replace hardcoded `garages[]` with data fetched from `GET /garages`.
- [ ] Deals & Offers Page:
  - Replace dummy items with data fetched from `GET /promos`.

---

### Sprint 5 — Quotes & Compare-Quotes Integration (Globalized Data)
**Duration**: 3-4 days
**Depends on**: Sprint 4
**API Endpoints**: §6 of DATA_API.md

#### Backend
- [ ] `GET /quotes` — fetch quotes
- [ ] `GET /quotes/:quoteId` — view quote details and compare data
- [ ] Database seeding: insert sample quotes so there's rich data to display.

#### Frontend Integration
- [ ] `apps/web/src/lib/quotes-api.ts` — quote API calls
- [ ] My Quotes & Compare Quotes Pages:
  - Replace hardcoded quotes and comparisons with live data.
  - *Constraint*: Fetch and show the same dataset for all users for now.

---

### Sprint 6 — Booking Flow Integration (Globalized Data)
**Duration**: 3-4 days
**Depends on**: Sprint 5
**API Endpoints**: §7 of DATA_API.md

#### Backend
- [ ] `GET /bookings` — list bookings
- [ ] `POST /bookings` — create a new booking in DB
- [ ] Database seeding: insert sample booking records.

#### Frontend Integration
- [ ] `apps/web/src/lib/bookings-api.ts` — booking API calls
- [ ] Bookings List & Overview Pages:
  - Replace hardcoded overview stats and lists with live DB data.
  - Wire booking actions (e.g. checkout, slot confirmation) to `POST /bookings`.
  - *Constraint*: Bookings are same/shared globally for all users for now.

---

## Dependency Order

```
Sprint 0 ✅ (Foundation)
    ↓
Sprint 0.5 ✅ (Auth Refactor)
    ↓
Sprint 1 ✅ (Auth + RBAC)
    ↓
Sprint 2 ✅ (Vehicles)
    ↓
Sprint 3 ✅ (AI Diagnosis)
    ↓
Sprint 4 (Garages & Promos)
    ↓
Sprint 5 (Quotes & Compare Quotes)
    ↓
Sprint 6 (Bookings)
```

---

## Estimated Remaining Duration

| Sprint | Days | Deliverable (Demo-able) |
|--------|------|-------------------------|
| Sprint 4 — Garages & Promos | 3-4 | Real garages and offers from DB |
| Sprint 5 — Quotes & Compare | 3-4 | Live quote comparison |
| Sprint 6 — Bookings | 3-4 | Live booking creation and history |
| **Total Remaining** | **9-12 days** | |


# Branch Diff Report: feat/api_integration vs upstream/Feat/api_integration

**Date**: 2026-07-11  
**Commits ahead**: 20 (feat/api_integration → upstream)  
**Files changed**: 138 (+15,651 / -37,404 lines)

---

## Executive Summary

The `feat/api_integration` branch contains a complete rewrite of the backend API and frontend data layer. The upstream branch has only the skeleton (auth + users). This branch adds 11 new API route modules, 14 database migrations, a full frontend API client, and rewrites ~30 web pages to fetch from the database instead of static data.

### Key Architecture Change: Customer Scoping Removed

All list/read endpoints now return **global (unscoped) data** instead of filtering by `customer_id`. Write operations (INSERT) still associate records with the authenticated user, but reads do not enforce ownership boundaries.

| Endpoint | Upstream | feat/api_integration |
|----------|----------|---------------------|
| `GET /vehicles` | N/A | Returns ALL active vehicles |
| `GET /bookings` | N/A | Returns ALL bookings globally |
| `GET /quotes` | N/A | Returns ALL quotes globally |
| `GET /quotes/requests` | N/A | Filters by `customer_id` (still scoped) |
| `GET /garages/search` | N/A | Public, returns all garages |
| `GET /diagnosis/:id` | N/A | Fetches by ID, no ownership check |

**Implication**: Any authenticated user can read any other user's vehicles, bookings, and quotes. This is acceptable for an internal/admin tool but would be a security concern for a production multi-tenant app.

---

## 1. Backend API Changes

### New Route Modules (11 total)

| Module | Route Prefix | Auth | Key Endpoints |
|--------|-------------|------|---------------|
| **vehicles** | `/vehicles` | `authenticate` | CRUD (list all, create, get, update, soft delete) |
| **bookings** | `/bookings` | `authenticate` | List all, get by ID, create (instant/quote-based), update status |
| **quotes** | `/quotes` | `authenticate` | List all, create request (auto-generates 3 mock quotes), get by ID |
| **diagnosis** | `/diagnosis` | `authenticate + requireRole` | Submit symptoms (LLM-powered), get results |
| **diagnose config** | `/diagnose/config` | None (public) | Categories, questions, issues, result summaries, trust items |
| **garages** | `/garages` | None (public search) | Search all, get by ID, onboarding (auth) |
| **marketplace** | `/marketplace` | TBD | Stub |
| **payments** | `/payments` | TBD | Stub |
| **reviews** | `/reviews` | TBD | Stub |
| **admin** | `/admin` | TBD | Stub |
| **promos** | `/api/v1/promos` | None | List all promos |

### Route Index (`apps/api/src/routes/index.ts`)
- Added 9 new router imports + mounts
- Health endpoint upgraded from sync `res.json()` to async with `success()` envelope
- Promos endpoint inlined in route index (not a separate module)

### Auth Module (`apps/api/src/modules/auth/auth.routes.ts`)
- **Google OAuth**: `POST /auth/google` — verifies Google ID token, creates/returns user
- **Phone OTP**: `POST /auth/register` (hardcoded OTP: `123456`, phones: `9876543210`, `1234567890`)
- **Login**: `POST /auth/login` — email/password
- **Refresh**: `POST /auth/refresh` — rotate refresh tokens
- **Logout**: `POST /auth/logout` — invalidate refresh token
- **Profile**: `GET /auth/me` — return current user from token

### New Infrastructure

| File | Purpose |
|------|---------|
| `apps/api/src/config/database.ts` | PostgreSQL connection pool via `pg` |
| `apps/api/src/config/env.ts` | Centralized env config (DB, JWT, AI keys) |
| `apps/api/src/middleware/auth.ts` | JWT verification + `requireRole` RBAC |
| `apps/api/src/services/jwt.service.ts` | Access/refresh token generation, DB-backed refresh store |
| `apps/api/src/services/google-auth.service.ts` | Google ID token verification |
| `apps/api/src/utils/response.ts` | `success()` / `error()` envelope helpers |
| `apps/api/src/types/express.d.ts` | Extend Express `Request` with `user` property |

### Database Migrations (14 total)

| Migration | Purpose |
|-----------|---------|
| `001_initial_schema.sql` | Core tables: users, roles, user_roles, vehicles, garages, quotes, bookings, etc. |
| `002_refresh_tokens.sql` | Refresh token storage table |
| `003_add_vehicle_soft_delete.sql` | `is_active` column for vehicle soft delete |
| `004_known_issues.sql` | Known issues / diagnosis knowledge base |
| `005_dummy_test_user.sql` | Seed test user |
| `006_promos.sql` | Promos table + seed data |
| `007_quotes.sql` | Quote requests + quotes tables |
| `008_bookings_seed.sql` | Sample booking data |
| `009_update_garages_rich_meta.sql` | Extended garage metadata |
| `010_remove_garages_ui_columns.sql` | Remove deprecated UI columns |
| `011_add_garages_response_mins.sql` | Response time tracking |
| `012_add_missing_garages.sql` | Additional garage seed data |
| `013_diagnose_ui_config.sql` | Diagnosis UI config tables |
| `014_diagnose_ui_config_seed.sql` | Diagnosis config seed data |

### Tests Added
- `apps/api/src/config/database.test.ts`
- `apps/api/src/config/env.test.ts`
- `apps/api/src/middleware/auth.test.ts`
- `apps/api/src/modules/auth/auth.routes.test.ts`
- `apps/api/src/modules/auth/auth.service.test.ts`
- `apps/api/src/modules/bookings/bookings.routes.test.ts`
- `apps/api/src/modules/diagnosis/diagnosis.service.test.ts`
- `apps/api/src/modules/diagnosis/knowledge.service.test.ts`
- `apps/api/src/modules/quotes/quotes.routes.test.ts`
- `apps/api/src/modules/vehicles/vehicles.routes.test.ts`

---

## 2. Frontend Changes

### New API Client (`apps/web/src/lib/api-client.ts`)
- Full-featured HTTP client with:
  - Auto-inject `Authorization` header from localStorage
  - 401 interceptor with automatic token refresh (deduped via shared promise)
  - Request/response interceptors
  - Typed `ApiError` class with status, code, details
  - Convenience methods: `apiClient.get()`, `.post()`, `.put()`, `.patch()`, `.delete()`

### New API Modules
| File | Endpoints Called |
|------|-----------------|
| `apps/web/src/lib/bookings-api.ts` | Bookings CRUD |
| `apps/web/src/lib/diagnosis-api.ts` | Diagnosis submit + config |
| `apps/web/src/lib/garages-api.ts` | Garage search + details |
| `apps/web/src/lib/quotes-api.ts` | Quote requests + quotes |

### New Auth Infrastructure
| File | Purpose |
|------|---------|
| `apps/web/src/lib/auth-context.tsx` | React context for auth state |
| `apps/web/src/components/common/auth-guard.tsx` | Route protection wrapper |
| `apps/web/src/components/common/protected-route.tsx` | Redirect unauthenticated users |
| `apps/web/src/components/common/otp-input.tsx` | OTP input component |
| `apps/web/src/app/login/page.tsx` | Login page (Google + Phone OTP) |
| `apps/web/src/app/signup/page.tsx` | Signup page |

### New Pages
| Page | Route |
|------|-------|
| `apps/web/src/pages/vehicles/vehicles-page.tsx` | Vehicle management |
| `apps/web/src/pages/bookings/bookings-page.tsx` | Booking list |
| `apps/web/src/pages/_app.tsx` | App wrapper with auth provider |

### Pages Rewritten (static → API-driven)

| Page | Key Changes |
|------|-------------|
| `garages-page.tsx` | Removed 240+ lines of hardcoded garage data; fetches from `GET /garages/search` |
| `quotes-page.tsx` | Fetches quotes from API instead of `quotesList` static import |
| `compare-quotes-page.tsx` | API-driven quote comparison |
| `finding-quotes-page.tsx` | API-driven quote search flow |
| `ai-diagnose-page.tsx` | 1,151-line rewrite; uses diagnosis API + config endpoints |
| `ai-diagnose-results-page.tsx` | API-driven results display |
| `deals-page.tsx` | Fetches promos from API |
| `request-aent-page.tsx` | Updated for API integration |
| `home-page.tsx` | Minor updates |
| `main-content.tsx` | Fetches garages/promos from API |
| `right-panel.tsx` | Fetches quotes from API |
| `top-navbar.tsx` | Auth state integration |
| `sidebar.tsx` | Minor updates |
| `data.tsx` | Reduced static data, added API fallbacks |

### New Shared Components
| Component | Purpose |
|-----------|---------|
| `vehicle-selector.tsx` | Reusable vehicle picker (fetches from API) |
| `use-diagnose-config.ts` | Hook for diagnosis config data |
| `promo-theme.ts` | Promo theme utilities |

---

## 3. Infrastructure & Config

| File | Change |
|------|--------|
| `docker-compose.yml` | Added PostgreSQL service |
| `render.yaml` | Restructured: separate DB + API services |
| `pnpm-workspace.yaml` | Added `apps/*` and `packages/*` |
| `package.json` | Switched from npm to pnpm; added `db:migrate` script |
| `apps/api/project.json` | Disabled bundling, external dependencies |
| `apps/web/project.json` | Updated build config |
| `tsconfig.base.json` | Minor config update |
| `.env.example` | Added DB, JWT, AI provider env vars |
| `apps/api/.env.test.example` | Test environment config |
| `.nxignore` | Added ignore patterns |
| `db/migrate.js` | Migration runner script |
| `wrectifai.postman_collection.json` | Postman collection for API testing |

---

## 4. Documentation Added

| File | Content |
|------|---------|
| `AGENTS.md` | AI assistant guidelines for this codebase |
| `DEVELOPER_GUIDE.md` | Developer setup and architecture guide |
| `Docs/PRD.md` | Product requirements document |
| `Docs/SCHEMA_2.md` | Database schema documentation |
| `Docs/SPRINT.md` | Sprint planning docs |
| `Docs/TESTING.md` | Testing guide |
| `Docs/RENDER.md` | Render deployment guide |
| `Docs/migration-vs-schema-report.md` | Migration analysis |

---

## 5. Risk Assessment

### Security Concerns
1. **No ownership scoping on reads**: Any authenticated user can read all vehicles, bookings, and quotes. Needs `WHERE customer_id = $1` on list endpoints if this is a multi-tenant app.
2. **Hardcoded OTP**: `123456` for phones `9876543210` / `1234567890` — fine for dev, must be removed for production.
3. **Mock quote generation**: `POST /quotes/requests` auto-inserts 3 fake quotes — dev convenience, not production behavior.

### Technical Debt
- Diagnosis service still takes `customerId` parameter but doesn't always use it for filtering
- Some stub routes (marketplace, payments, reviews) have no implementation

### Test Coverage
- 10 test files added covering auth, vehicles, bookings, quotes, diagnosis
- No frontend tests added

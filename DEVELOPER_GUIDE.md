# WrectifAI — Developer Guide

This guide is designed for developers working on the WrectifAI codebase. It provides details on engineering guidelines, code organization, state management, testing, and daily development workflows.

---

## 🛠️ Monorepo Operations with Nx

This project is a monorepo managed by **Nx**.

### Essential Commands

- **Start API server**: `nx serve api`
- **Start Web dev server**: `nx dev web`
- **Start Mobile dev server**: `nx start mobile`
- **Build all applications**: `nx run-many -t build --all`
- **Lint all files**: `nx run-many -t lint --all`
- **Run all tests**: `nx run-many -t test --all`
- **Visualize workspace dependency graph**: `npx nx graph`

For more details on monorepo configurations, see the root [nx.json](file:///c:/Users/vishn/PROJECT/wrectifai/nx.json).

---

## 💾 Backend API Developer Guide (`apps/api`)

The backend is built using Node.js, Express, and PostgreSQL. It uses CommonJS and is bundled via Nx using `esbuild`.

### 1. Database Access Rules
* **No ORMs Allowed**: Do not install Drizzle, Prisma, or any other ORM.
* **SQL Queries**: Always write parameterized, raw SQL queries.
* **Database Client Helper**: Import `query` from `config/database.ts`:
  ```typescript
  import { query } from '../../config/database';

  // Example Query:
  const result = await query(
    'SELECT * FROM vehicles WHERE customer_id = $1',
    [customerId]
  );
  ```

### 2. DB Migrations & Seeding
* Migrations reside in the [db/migrations](file:///c:/Users/vishn/PROJECT/wrectifai/db/migrations) directory.
* Raw SQL schema files run automatically when initializing the database container.
* Add any new table creations, GIN indexes, or custom functions as sequentially numbered `.sql` scripts.

### 3. Route Versioning & Routing Structure
* Mount all routes under the `/api/v1` prefix in [routes/index.ts](file:///c:/Users/vishn/PROJECT/wrectifai/apps/api/src/routes/index.ts).
* Mount a fallback `/api` prefix pointing to the same router to handle legacy calls.
* Example module structure:
  ```
  modules/diagnosis/
  ├── diagnosis.routes.ts       # Route endpoints definition
  ├── diagnosis.service.ts      # Core business logic
  ├── diagnosis.service.test.ts # Service unit tests
  ├── knowledge.service.ts      # Database RAG lookup queries
  └── knowledge.service.test.ts # Lookup queries test suites
  ```

### 4. API Response Conventions
Always wrap endpoint responses in standard response envelopes:

* **Success response**:
  ```typescript
  import { success } from '../../utils/response';
  
  return success(res, { data: 'payload' }, 200);
  ```
* **Error response**:
  ```typescript
  import { error } from '../../utils/response';
  
  return error(res, 'Symptom text is required', 'VALIDATION_ERROR', 400);
  ```

### 5. Authentication & Strict RBAC
* Secure endpoints using the `authenticate` middleware.
* Enforce Role-Based Access Control (RBAC) via the `requireRole(['role'])` helper, which matches user groups using the `user_roles` database table.
  ```typescript
  import { authenticate, requireRole } from '../../middleware/auth';

  router.post('/', authenticate, requireRole(['user']), createDiagnosis);
  ```

---

## 🎨 Frontend Developer Guide (`apps/web` & `apps/mobile`)

We follow a strict, component-first architecture.

### 1. Reusable Primitive Components
All shared primitives (such as Buttons, Inputs, Dialogs, Badges, or Toast alerts) must be created **once** in the respective central directories:
- **Web**: `apps/web/src/components/common`
- **Mobile**: `apps/mobile/src/components/common`

> [!IMPORTANT]
> Never copy-paste primitives or build ad-hoc variations inside local feature pages. Centralize them as reusable variants instead.

### 2. State & Context Providers
- **Auth Guard**: Use `<AuthGuard>` wrapper inside pages to guard private user routes. Context is consumed via `useAuth()`.
- **Vehicle Selector**: Consume the user's selected vehicle context using the custom selector hook. When navigating pages, components must automatically bind queries to the active vehicle context.

---

## 🧪 Testing Guidelines

Our automated testing philosophy guarantees that every API integration and security rule remains secure.

### Running Tests
- Run all workspace tests: `pnpm test`
- Run API unit tests: `pnpm test:api:unit`
- Run API integration tests: `pnpm test:api`

### Test Structure
- Unit test files must follow the format `*.test.ts` and reside alongside the service code they test.
- Mock all third-party external integrations (e.g., Groq, OpenAI, Stripe) inside unit tests to prevent network dependencies.

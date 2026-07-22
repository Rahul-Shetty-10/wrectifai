# Wrectifai Project Rules (AGENTS.md)

Guidelines for AI Coding Assistants working on this codebase.

## Tech Stack & Architecture
- **Backend API**: Node.js v22 (CommonJS bundled via Nx & esbuild), Express, and PostgreSQL.
- **Database Access**: Use raw SQL queries with the `query` helper exported from [database.ts](file:///c:/Users/vishn/PROJECT/wrectifai/apps/api/src/config/database.ts). Do not introduce ORMs (Drizzle/Prisma) unless explicitly requested.
- **Route Versioning**: Mount all routes under the `/api/v1` prefix in [routes/index.ts](file:///c:/Users/vishn/PROJECT/wrectifai/apps/api/src/routes/index.ts) (with `/api` fallback mapped to the same router).

## API & Response Conventions
- **Success Responses**: Always return responses using the standard success envelope helper:
  `success(res, data, statusCode, meta?)` -> `{ data, meta? }`
- **Error Responses**: Wrap exceptions using the standard error envelope helper:
  `error(res, message, errorCode, statusCode, details?)` -> `{ error: { code, message, details? } }`
- **Authentication**: Standardize endpoint authorization using the `authenticate` middleware in [auth.ts](file:///c:/Users/vishn/PROJECT/wrectifai/apps/api/src/middleware/auth.ts).
- **Strict RBAC**: Guard restricted endpoints with `requireRole(['user', 'garage', 'vendor', 'admin'])`. Map roles via the `user_roles` database junction table rather than inferring them from profiles.

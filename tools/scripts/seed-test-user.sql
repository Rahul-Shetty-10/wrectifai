-- If this local dev DB already has the older auth tables with id/phone/user_id
-- columns, drop them first so the schema below can be recreated exactly:
-- DROP TABLE IF EXISTS user_roles;
-- DROP TABLE IF EXISTS otp_challenges;
-- DROP TABLE IF EXISTS roles;
-- DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  "_id" TEXT PRIMARY KEY,
  email TEXT,
  "mobileNumber" TEXT,
  "passwordHash" TEXT,
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'pendingVerification')),
  CONSTRAINT users_email_or_mobile_check CHECK (email IS NOT NULL OR "mobileNumber" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS roles (
  "_id" TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roles_code_check CHECK (code IN ('customer', 'garage', 'vendor', 'admin'))
);

CREATE TABLE IF NOT EXISTS user_roles (
  "_id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
  "roleId" TEXT NOT NULL REFERENCES roles("_id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_user_role_unique UNIQUE ("userId", "roleId")
);

CREATE TABLE IF NOT EXISTS otp_challenges (
  "mobileNumber" TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "verifiedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
  ON users (email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_number_unique_idx
  ON users ("mobileNumber")
  WHERE "mobileNumber" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roles_code_unique_idx
  ON roles (code);

CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users ("createdAt");

INSERT INTO roles ("_id", code, name)
VALUES
  ('customer-role', 'customer', 'Customer'),
  ('garage-role', 'garage', 'Garage'),
  ('vendor-role', 'vendor', 'Vendor'),
  ('admin-role', 'admin', 'Admin')
ON CONFLICT (code) DO NOTHING;

INSERT INTO users ("_id", "mobileNumber", name, status, "createdAt", "updatedAt")
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '+919876543210',
  'Test Customer',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT ("mobileNumber")
WHERE "mobileNumber" IS NOT NULL
DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();

DELETE FROM user_roles
WHERE "userId" = (
  SELECT "_id" FROM users WHERE "mobileNumber" = '+919876543210'
);

INSERT INTO user_roles ("_id", "userId", "roleId")
SELECT
  '00000000-0000-4000-8000-000000000101',
  users."_id",
  roles."_id"
FROM users
CROSS JOIN roles
WHERE users."mobileNumber" = '+919876543210'
  AND roles.code = 'customer'
ON CONFLICT ("userId", "roleId") DO NOTHING;

INSERT INTO otp_challenges ("mobileNumber", code, "expiresAt", "verifiedAt", "createdAt")
VALUES ('+919876543210', '123456', NOW() + INTERVAL '30 days', NULL, NOW())
ON CONFLICT ("mobileNumber")
DO UPDATE SET code = EXCLUDED.code, "expiresAt" = EXCLUDED."expiresAt", "verifiedAt" = NULL, "createdAt" = NOW();

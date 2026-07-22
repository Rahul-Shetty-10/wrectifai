# Migration vs Schema Conformance Report

**Generated**: 2026-07-07
**Scope**: Compare `db/migrations/*.sql` against `Docs/schema.md`

---

## Executive Summary

29 tables exist across 8 migration files. 26 conform to `schema.md`. 3 tables and 2 columns exist in migrations but are undocumented. 1 geo index is missing.

---

## 1. Tables in Migrations but NOT in `schema.md`

| # | Table | Migration | Purpose | Schema Status |
|---|-------|-----------|---------|---------------|
| 1 | `refresh_tokens` | `002_refresh_tokens.sql` | Auth refresh token tracking | Not documented |
| 2 | `known_issues` | `004_known_issues.sql` | Diagnosis knowledge base (18 seeded rows) | Not documented |
| 3 | `promos` | `006_promos.sql` | Promotional/combo offer cards (8 seeded rows) | Not documented |

---

## 2. Schema.md Fields Missing from Initial Migration (Added Later)

| Table | Field | Type | Added by Migration | Notes |
|-------|-------|------|---------------------|-------|
| `vehicles` | `is_active` | `BOOLEAN NOT NULL DEFAULT true` | `003_add_vehicle_soft_delete.sql` | Soft delete support |
| `quotes` | `details` | `JSONB` | `007_quotes.sql` | Quote breakdown metadata (parts, labour, GST, availability, etc.) |

---

## 3. Missing Geo Index

| Table | Column | Expected (schema.md) | Actual (migration) | Impact |
|-------|--------|----------------------|---------------------|--------|
| `garages` | `location` | 2dsphere spatial index | JSONB column, no geo index | Nearby garage search won't work spatially |

The `garages.location` column stores `{"lat": ..., "lng": ...}` as JSONB but no spatial index is created. To support radius-based garage queries, either PostGIS or a GiST index with a computed point is needed.

---

## 4. Missing `updated_at` Triggers

`001_initial_schema.sql` defines an `update_updated_at_column()` trigger function but does not apply it to all tables that have `updated_at`.

| Table | Has Trigger | Notes |
|-------|-------------|-------|
| `users` | Yes | |
| `roles` | Yes | |
| `user_roles` | Yes | |
| `vehicles` | Yes | |
| `vehicle_service_history` | N/A | No `updated_at` column |
| `diagnosis_requests` | N/A | No `updated_at` column |
| `diagnosis_media` | N/A | No `updated_at` column |
| `diagnosis_results` | N/A | No `updated_at` column |
| `garages` | Yes | |
| `garage_documents` | **No** | Has `created_at` but no `updated_at` |
| `garage_slots` | N/A | No `updated_at` column |
| `quote_requests` | N/A | No `updated_at` column |
| `quotes` | N/A | No `updated_at` column |
| `bookings` | Yes | |
| `sellers` | N/A | No `updated_at` column |
| `products` | Yes | |
| `inventory` | Yes | |
| `carts` | Yes | |
| `orders` | Yes | |
| `payments` | Yes | |
| `reviews` | N/A | No `updated_at` column |
| `garage_badges` | N/A | No `updated_at` column |
| `notifications` | N/A | No `updated_at` column |
| `refresh_tokens` | N/A | No `updated_at` column |
| `known_issues` | N/A | No `updated_at` column |
| `promos` | N/A | No `updated_at` column |

---

## 5. Column-by-Column Conformance (26 Matching Tables)

### 5.1 RBAC Identity

**`users`**
| schema.md | migration | Match |
|-----------|-----------|-------|
| `_id` | `id UUID PK` | OK (snake_case convention) |
| `email` | `email VARCHAR(255) UNIQUE` | OK |
| `mobileNumber` | `mobile_number VARCHAR(20) UNIQUE` | OK |
| `passwordHash` | `password_hash VARCHAR(255)` | OK |
| `name` | `name VARCHAR(255) NOT NULL` | OK |
| `status` | `VARCHAR(50) NOT NULL CHECK(...)` | OK |
| `createdAt` | `created_at TIMESTAMPTZ DEFAULT NOW()` | OK |
| `updatedAt` | `updated_at TIMESTAMPTZ DEFAULT NOW()` | OK |

**`roles`**
| schema.md | migration | Match |
|-----------|-----------|-------|
| `code` | `VARCHAR(50) UNIQUE CHECK(...)` | OK |
| `name` | `VARCHAR(100) NOT NULL` | OK |

**`user_roles`**
| schema.md | migration | Match |
|-----------|-----------|-------|
| `userId` | `user_id UUID NOT NULL REFERENCES users(id)` | OK |
| `roleId` | `role_id UUID NOT NULL REFERENCES roles(id)` | OK |
| Unique constraint `{userId, roleId}` | `UNIQUE(user_id, role_id)` | OK |

### 5.2 Vehicle

**`vehicles`**
| schema.md | migration | Match |
|-----------|-----------|-------|
| `customerId` | `customer_id UUID REFERENCES users(id)` | OK |
| `make` | `VARCHAR(100) NOT NULL` | OK |
| `model` | `VARCHAR(100) NOT NULL` | OK |
| `year` | `INTEGER NOT NULL` | OK |
| `vin` | `VARCHAR(17) UNIQUE` | OK |
| `mileage` | `INTEGER` | OK |
| `warranty` | `JSONB` | OK |
| `isActive` | *(added in 003)* | OK |
| `createdAt` / `updatedAt` | `TIMESTAMPTZ` | OK |

**`vehicle_service_history`**
| schema.md | migration | Match |
|-----------|-----------|-------|
| `vehicleId` | `UUID REFERENCES vehicles(id)` | OK |
| `serviceDate` | `TIMESTAMPTZ NOT NULL` | OK |
| `description` | `TEXT NOT NULL` | OK |
| `garageId` | `UUID` | OK |
| `cost` | `NUMERIC(12,2)` | OK |

### 5.3 Diagnosis

**`diagnosis_requests`** - All fields match.

**`diagnosis_media`** - All fields match. `media_type` CHECK constraint matches enum values.

**`diagnosis_results`**
| schema.md | migration | Match |
|-----------|-----------|-------|
| `issues` | `JSONB NOT NULL` | OK |
| `confidenceScore` | `INTEGER CHECK (0-100)` | OK |
| `riskLevel` | `VARCHAR(20) CHECK(...)` | OK |
| `diyAllowed` | `BOOLEAN NOT NULL` | OK |
| `diySteps` | `TEXT[]` | OK |
| `nextAction` | `VARCHAR(50) CHECK(...)` | OK |

### 5.4 Garage and Quote

**`garages`** - All fields match. `location` stored as JSONB (see Section 3 for geo index gap).

**`garage_documents`** - All fields match.

**`garage_slots`** - All fields match.

**`quote_requests`** - All fields match.

**`quotes`**
| schema.md | migration | Match |
|-----------|-----------|-------|
| `quoteRequestId` | `UUID REFERENCES quote_requests(id)` | OK |
| `garageId` | `UUID REFERENCES garages(id)` | OK |
| `amount` | `NUMERIC(12,2) NOT NULL` | OK |
| `currency` | `VARCHAR(3) DEFAULT 'USD'` | OK |
| `etaDays` | `INTEGER` | OK |
| `status` | `VARCHAR(50) CHECK(...)` | OK |
| *(not in schema)* | `details JSONB` *(added in 007)* | Extra |

**`bookings`** - All fields match. `quote_id` nullable for instant booking as expected.

### 5.5 Marketplace

**`sellers`** - All fields match.

**`products`** - All fields match. `compatible_vehicle_rules` stored as JSONB.

**`inventory`** - All fields match. `product_id UNIQUE` as expected.

**`carts`** - All fields match. `items` stored as JSONB.

**`orders`** - All fields match. `order_number VARCHAR(50) UNIQUE`. `shipping_address` stored as JSONB.

### 5.6 Payment and Trust

**`payments`** - All fields match. `provider_intent_id VARCHAR(255) UNIQUE`.

**`reviews`** - All fields match. `booking_id UUID UNIQUE` (one review per booking).

**`garage_badges`** - All fields match. `badge_key` CHECK constraint matches enum values.

### 5.7 Notification

**`notifications`** - All fields match. `channel` CHECK constraint matches enum values.

---

## 6. Seed Data Coverage

| Migration | Seeds |
|-----------|-------|
| `001_initial_schema.sql` | 4 roles: customer, garage, vendor, admin |
| `005_dummy_test_user.sql` | 1 test customer + 1 vehicle + 1 service history |
| `006_promos.sql` | 1 garage owner user, 7 garages, 8 promos |
| `007_quotes.sql` | 1 garage, 1 quote request, 8 quotes with detail JSONB |
| `008_bookings_seed.sql` | 2 bookings (1 instant, 1 quoteBased) |

---

## 7. Recommendations

1. **Update `schema.md`** to document `refresh_tokens`, `known_issues`, and `promos` tables.
2. **Back-port `quotes.details`** column definition into `schema.md`.
3. **Add geo index** on `garages.location` (either PostGIS `GIST` or a computed lat/lng index).
4. **Consider `updated_at` trigger** on tables that have mutable rows but no trigger (`garage_documents` if edits are expected).

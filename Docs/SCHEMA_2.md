# PostgreSQL Schema - WRECTIFAI

Source of truth: `db/migrations/*.sql`
Reference: `Docs/schema.md` (original MongoDB design)

PostgreSQL 15+ | UUID primary keys | JSONB for flexible objects | `TIMESTAMPTZ` for all timestamps

---

## Conventions

| MongoDB (schema.md) | PostgreSQL (this doc) |
|---------------------|-----------------------|
| `camelCase` fields | `snake_case` columns |
| `ObjectId` | `UUID` (uuid-ossp) |
| `Array<String>` | `TEXT[]` |
| `Object` | `JSONB` |
| `Date` | `TIMESTAMPTZ` |
| `String enum` | `VARCHAR` + `CHECK` constraint |
| Logical FK | Enforced `REFERENCES ... ON DELETE` |
| `updatedAt` via app | DB trigger `update_updated_at_column()` |

---

## 1. RBAC Identity

### `users`

| Column          | Type           | Constraints                                                    | Notes                    |
| --------------- | -------------- | -------------------------------------------------------------- | ------------------------ |
| `id`            | `UUID`         | PK, DEFAULT `uuid_generate_v4()`                               |                          |
| `email`         | `VARCHAR(255)` | UNIQUE                                                         | Email auth               |
| `mobile_number` | `VARCHAR(20)`  | UNIQUE                                                         | Phone auth               |
| `name`          | `VARCHAR(255)` | NOT NULL                                                       | Display name             |
| `status`        | `VARCHAR(50)`  | NOT NULL, CHECK (`active`, `suspended`, `pendingVerification`) |                          |
| `created_at`    | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                                        |                          |
| `updated_at`    | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                                        | Auto-updated via trigger |

**Indexes**: `status`, `created_at`

---

### `roles`

| Column       | Type           | Constraints                                                       | Notes                    |
| ------------ | -------------- | ----------------------------------------------------------------- | ------------------------ |
| `id`         | `UUID`         | PK, DEFAULT `uuid_generate_v4()`                                  |                          |
| `code`       | `VARCHAR(50)`  | NOT NULL, UNIQUE, CHECK (`customer`, `garage`, `vendor`, `admin`) |                          |
| `name`       | `VARCHAR(100)` | NOT NULL                                                          | Human readable           |
| `created_at` | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                                           |                          |
| `updated_at` | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                                           | Auto-updated via trigger |

**Seed**: 4 roles inserted by `001_initial_schema.sql`

---

### `user_roles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `user_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `role_id` | `UUID` | NOT NULL, FK → `roles(id)` ON DELETE CASCADE | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Constraints**: `UNIQUE(user_id, role_id)`
**Indexes**: `user_id`, `role_id`

---

## 2. Vehicle

### `vehicles`

| Column        | Type           | Constraints                                  | Notes                                |
| ------------- | -------------- | -------------------------------------------- | ------------------------------------ |
| `id`          | `UUID`         | PK, DEFAULT `uuid_generate_v4()`             |                                      |
| `customer_id` | `UUID`         | NOT NULL, FK → `users(id)` ON DELETE CASCADE |                                      |
| `make`        | `VARCHAR(100)` | NOT NULL                                     | e.g. Honda                           |
| `model`       | `VARCHAR(100)` | NOT NULL                                     | e.g. City                            |
| `year`        | `INTEGER`      | NOT NULL                                     |                                      |
| `vin`         | `VARCHAR(17)`  | UNIQUE                                       | Optional, 17-char VIN                |
| `mileage`     | `INTEGER`      |                                              | Odometer reading                     |
| `warranty`    | `JSONB`        |                                              | `{ provider, policyNo, expiry }`     |
| `is_active`   | `BOOLEAN`      | NOT NULL, DEFAULT true                       | Soft delete (added in migration 003) |
| `created_at`  | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                      |                                      |
| `updated_at`  | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                      | Auto-updated via trigger             |

**Indexes**: `customer_id`, `created_at`, `is_active`

---

### `vehicle_service_history`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `vehicle_id` | `UUID` | NOT NULL, FK → `vehicles(id)` ON DELETE CASCADE | |
| `service_date` | `TIMESTAMPTZ` | NOT NULL | |
| `description` | `TEXT` | NOT NULL | |
| `garage_id` | `UUID` | | Optional FK → `garages(id)` |
| `cost` | `NUMERIC(12,2)` | | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `vehicle_id`

---

## 3. Diagnosis

### `diagnosis_requests`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `customer_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `vehicle_id` | `UUID` | NOT NULL, FK → `vehicles(id)` ON DELETE CASCADE | |
| `symptom_text` | `TEXT` | | Free-text symptom description |
| `status` | `VARCHAR(50)` | NOT NULL, CHECK (`received`, `processing`, `completed`, `failed`) | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `customer_id`, `vehicle_id`, `status`

---

### `diagnosis_media`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `diagnosis_request_id` | `UUID` | NOT NULL, FK → `diagnosis_requests(id)` ON DELETE CASCADE | |
| `media_type` | `VARCHAR(20)` | NOT NULL, CHECK (`image`, `video`, `audio`) | |
| `url` | `TEXT` | NOT NULL | Storage URL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `diagnosis_request_id`

---

### `diagnosis_results`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `diagnosis_request_id` | `UUID` | NOT NULL, UNIQUE, FK → `diagnosis_requests(id)` ON DELETE CASCADE | One result per request |
| `issues` | `JSONB` | NOT NULL | Array of `{ issue, confidence }` objects |
| `confidence_score` | `INTEGER` | NOT NULL, CHECK (0–100) | |
| `risk_level` | `VARCHAR(20)` | NOT NULL, CHECK (`low`, `medium`, `high`, `critical`) | |
| `diy_allowed` | `BOOLEAN` | NOT NULL | Must be false for high/critical |
| `diy_steps` | `TEXT[]` | | Safe DIY steps, low-risk only |
| `next_action` | `VARCHAR(50)` | NOT NULL, CHECK (`diy`, `bookGarage`, `buyParts`) | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `risk_level`

---

### `known_issues` *(not in schema.md — added in migration 004)*

Knowledge base of common vehicle issues for diagnosis matching.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `category` | `VARCHAR(100)` | NOT NULL | e.g. `engine_noise`, `brake_vibration` |
| `symptom_keywords` | `TEXT[]` | NOT NULL | Search terms for matching |
| `makes` | `TEXT[]` | | NULL = matches all makes |
| `year_from` | `INTEGER` | | Optional year range filter |
| `year_to` | `INTEGER` | | Optional year range filter |
| `issue_name` | `VARCHAR(255)` | NOT NULL | |
| `description` | `TEXT` | NOT NULL | |
| `risk_level` | `VARCHAR(20)` | NOT NULL, CHECK (`low`, `medium`, `high`, `critical`) | |
| `diy_allowed` | `BOOLEAN` | NOT NULL, DEFAULT true | |
| `safety_critical` | `BOOLEAN` | NOT NULL, DEFAULT false | |
| `required_parts` | `JSONB` | DEFAULT `'[]'` | `[{ name, category }]` |
| `estimated_cost_min` | `NUMERIC(10,2)` | NOT NULL | |
| `estimated_cost_max` | `NUMERIC(10,2)` | NOT NULL | |
| `diy_steps` | `TEXT[]` | DEFAULT `'{}'` | |
| `garage_steps` | `TEXT[]` | DEFAULT `'{}'` | |
| `base_confidence` | `NUMERIC(5,2)` | NOT NULL | Base match confidence score |

**Indexes**: `category`, GIN on `symptom_keywords`, GIN on `makes`
**Seed**: 18 rows across 6 categories (engine_noise, ac_not_cooling, brake_vibration, low_pickup, starting_issue, steering_suspension)

---

## 4. Garage and Quote

### `garages`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `owner_user_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | Garage owner |
| `name` | `VARCHAR(255)` | NOT NULL | |
| `address` | `TEXT` | NOT NULL | |
| `location` | `JSONB` | | `{ "lat": ..., "lng": ... }` — no spatial index |
| `specializations` | `TEXT[]` | | e.g. engine, brakes, EV |
| `certifications` | `TEXT[]` | | e.g. ISO 9001, ASE |
| `pickup_drop_supported` | `BOOLEAN` | NOT NULL, DEFAULT false | |
| `approval_status` | `VARCHAR(50)` | NOT NULL, CHECK (`pending`, `approved`, `rejected`, `suspended`) | |
| `rating_avg` | `NUMERIC(3,2)` | | Denormalized average |
| `rating_count` | `INTEGER` | DEFAULT 0 | Denormalized count |
| `starting_price` | `VARCHAR(100)` | | UI display, e.g. "Starting ₹499" |
| `distance_km` | `VARCHAR(100)` | | UI display, e.g. "3.1 km" |
| `badge` | `VARCHAR(100)` | | e.g. "Most Trusted", "Top Rated" |
| `image` | `TEXT` | | Garage image path or URL |
| `response_mins` | `INTEGER` | DEFAULT 30 | Avg response time in minutes |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Indexes**: `owner_user_id`, `approval_status`, GIN on `specializations`
**Note**: No 2dsphere or GiST index on `location`. Nearby search requires spatial index.
**Seed**: 12 garages across Hyderabad (migrations 006, 007, 012)

---

### `garage_documents`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `garage_id` | `UUID` | NOT NULL, FK → `garages(id)` ON DELETE CASCADE | |
| `doc_type` | `VARCHAR(100)` | NOT NULL | license, cert |
| `file_url` | `TEXT` | NOT NULL | |
| `verification_status` | `VARCHAR(50)` | NOT NULL, CHECK (`pending`, `approved`, `rejected`) | |
| `reviewed_by` | `UUID` | | FK → `users(id)`, admin reviewer |
| `reviewed_at` | `TIMESTAMPTZ` | | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `garage_id`, `verification_status`
**Note**: No `updated_at` trigger.

---

### `garage_slots`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `garage_id` | `UUID` | NOT NULL, FK → `garages(id)` ON DELETE CASCADE | |
| `start_at` | `TIMESTAMPTZ` | NOT NULL | |
| `end_at` | `TIMESTAMPTZ` | NOT NULL | |
| `is_available` | `BOOLEAN` | NOT NULL, DEFAULT true | |

**Indexes**: `garage_id`, `start_at`, `is_available`

---

### `quote_requests`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `customer_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `vehicle_id` | `UUID` | NOT NULL, FK → `vehicles(id)` ON DELETE CASCADE | |
| `diagnosis_request_id` | `UUID` | | FK → `diagnosis_requests(id)`, optional |
| `issue_summary` | `TEXT` | NOT NULL | |
| `preferred_date` | `TIMESTAMPTZ` | | |
| `status` | `VARCHAR(50)` | NOT NULL, CHECK (`open`, `quoted`, `selected`, `expired`, `cancelled`) | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `customer_id`, `vehicle_id`, `status`

---

### `quotes`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `quote_request_id` | `UUID` | NOT NULL, FK → `quote_requests(id)` ON DELETE CASCADE | |
| `garage_id` | `UUID` | NOT NULL, FK → `garages(id)` ON DELETE CASCADE | |
| `amount` | `NUMERIC(12,2)` | NOT NULL | Total quote amount |
| `currency` | `VARCHAR(3)` | NOT NULL, DEFAULT 'USD' | |
| `eta_days` | `INTEGER` | | Estimated completion days |
| `status` | `VARCHAR(50)` | NOT NULL, CHECK (`active`, `selected`, `rejected`, `withdrawn`) | |
| `details` | `JSONB` | | Quote breakdown (added in migration 007) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**`details` shape**:
```json
{
  "ui_status": "new|viewed|expired|open",
  "parts": 1650,
  "labour": 1050,
  "consumables": 200,
  "gst": 150,
  "availability": "Today, 6:00 PM",
  "pickup_drop": "Available|Not Available",
  "warranty": "6 Months / 10,000 km",
  "experience": "8+ Years",
  "savings": 450,
  "tag": "Express service",
  "image": "/assets/garage_2_1778071173295.png"
}
```

**Indexes**: `quote_request_id`, `garage_id`, `status`
**Seed**: 8 quotes across 8 garages for one quote request

---

### `bookings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `customer_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `garage_id` | `UUID` | NOT NULL, FK → `garages(id)` ON DELETE CASCADE | |
| `vehicle_id` | `UUID` | NOT NULL, FK → `vehicles(id)` ON DELETE CASCADE | |
| `quote_id` | `UUID` | | FK → `quotes(id)`, NULL for instant booking |
| `booking_type` | `VARCHAR(50)` | NOT NULL, CHECK (`instant`, `quoteBased`) | |
| `scheduled_at` | `TIMESTAMPTZ` | NOT NULL | |
| `status` | `VARCHAR(50)` | NOT NULL, CHECK (`pendingPayment`, `confirmed`, `inService`, `completed`, `cancelled`) | |
| `total_amount` | `NUMERIC(12,2)` | NOT NULL | |
| `currency` | `VARCHAR(3)` | NOT NULL, DEFAULT 'USD' | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Indexes**: `customer_id`, `garage_id`, `vehicle_id`, `booking_type`, `scheduled_at`, `status`
**Seed**: 2 bookings (1 instant, 1 quoteBased) in migration 008

---

## 5. Marketplace

### `sellers`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `seller_type` | `VARCHAR(50)` | NOT NULL, CHECK (`platform`, `garage`, `vendor`) | |
| `user_id` | `UUID` | | FK → `users(id)` ON DELETE SET NULL |
| `garage_id` | `UUID` | | FK → `garages(id)` ON DELETE SET NULL |
| `approval_status` | `VARCHAR(50)` | NOT NULL, CHECK (`pending`, `approved`, `rejected`) | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `seller_type`, `user_id`, `garage_id`, `approval_status`

---

### `products`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `seller_id` | `UUID` | NOT NULL, FK → `sellers(id)` ON DELETE CASCADE | |
| `name` | `VARCHAR(255)` | NOT NULL | |
| `description` | `TEXT` | | |
| `category` | `VARCHAR(100)` | NOT NULL | |
| `price` | `NUMERIC(12,2)` | NOT NULL | |
| `currency` | `VARCHAR(3)` | NOT NULL, DEFAULT 'USD' | |
| `is_diy_kit` | `BOOLEAN` | NOT NULL, DEFAULT false | DIY kit flag |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT true | |
| `compatible_vehicle_rules` | `JSONB` | | Make/model/year matching rules |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Indexes**: `seller_id`, `name`, `category`, `is_diy_kit`, `is_active`

---

### `inventory`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `product_id` | `UUID` | NOT NULL, UNIQUE, FK → `products(id)` ON DELETE CASCADE | One row per product |
| `qty_available` | `INTEGER` | NOT NULL, DEFAULT 0, CHECK (>= 0) | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Indexes**: `qty_available`

---

### `carts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `customer_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `items` | `JSONB` | NOT NULL, DEFAULT '[]' | `[{ productId, qty, unitPrice }]` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Indexes**: `customer_id`

---

### `orders`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `customer_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `order_number` | `VARCHAR(50)` | NOT NULL, UNIQUE | |
| `status` | `VARCHAR(50)` | NOT NULL, CHECK (`pendingPayment`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`) | |
| `subtotal` | `NUMERIC(12,2)` | NOT NULL | |
| `shipping_cost` | `NUMERIC(12,2)` | NOT NULL | |
| `tax` | `NUMERIC(12,2)` | NOT NULL | |
| `total` | `NUMERIC(12,2)` | NOT NULL | |
| `currency` | `VARCHAR(3)` | NOT NULL, DEFAULT 'USD' | |
| `fulfillment_mode` | `VARCHAR(50)` | NOT NULL, CHECK (`inHouse`, `thirdParty`) | |
| `shipping_address` | `JSONB` | NOT NULL | Address object |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Indexes**: `customer_id`, `status`, `fulfillment_mode`, `created_at`

---

## 6. Payment and Trust

### `payments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `payer_user_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `booking_id` | `UUID` | | FK → `bookings(id)` ON DELETE SET NULL |
| `order_id` | `UUID` | | FK → `orders(id)` ON DELETE SET NULL |
| `provider` | `VARCHAR(100)` | NOT NULL | e.g. stripe |
| `provider_intent_id` | `VARCHAR(255)` | NOT NULL, UNIQUE | Payment provider reference |
| `amount` | `NUMERIC(12,2)` | NOT NULL | |
| `currency` | `VARCHAR(3)` | NOT NULL, DEFAULT 'USD' | |
| `status` | `VARCHAR(50)` | NOT NULL, CHECK (`created`, `requiresAction`, `succeeded`, `failed`, `refunded`) | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | Auto-updated via trigger |

**Indexes**: `payer_user_id`, `booking_id`, `order_id`, `status`, `created_at`

---

### `reviews`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `booking_id` | `UUID` | NOT NULL, UNIQUE, FK → `bookings(id)` ON DELETE CASCADE | One review per booking |
| `customer_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `garage_id` | `UUID` | NOT NULL, FK → `garages(id)` ON DELETE CASCADE | |
| `rating_overall` | `INTEGER` | NOT NULL, CHECK (1–5) | |
| `rating_price` | `INTEGER` | CHECK (1–5) | Optional sub-rating |
| `rating_quality` | `INTEGER` | CHECK (1–5) | Optional sub-rating |
| `rating_time` | `INTEGER` | CHECK (1–5) | Optional sub-rating |
| `rating_behavior` | `INTEGER` | CHECK (1–5) | Optional sub-rating |
| `comment` | `TEXT` | | |
| `is_verified` | `BOOLEAN` | NOT NULL, DEFAULT false | True only after completed booking |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `customer_id`, `garage_id`, `is_verified`

---

### `garage_badges`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `garage_id` | `UUID` | NOT NULL, FK → `garages(id)` ON DELETE CASCADE | |
| `badge_key` | `VARCHAR(50)` | NOT NULL, CHECK (`topRated`, `budgetFriendly`, `evSpecialist`, `mostTrusted`) | |
| `active` | `BOOLEAN` | NOT NULL, DEFAULT true | |
| `awarded_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `garage_id`, `badge_key`, `active`

---

## 7. Notification

### `notifications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT `uuid_generate_v4()` | |
| `user_id` | `UUID` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | |
| `channel` | `VARCHAR(20)` | NOT NULL, CHECK (`sms`, `email`, `push`, `inApp`) | |
| `template_key` | `VARCHAR(100)` | NOT NULL | |
| `payload` | `JSONB` | | Channel-specific data |
| `status` | `VARCHAR(20)` | NOT NULL, CHECK (`queued`, `sent`, `failed`) | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `user_id`, `channel`, `status`, `created_at`

---

## 8. Promotional *(not in schema.md — added in migration 006)*

### `promos`

| Column           | Type            | Constraints                                           | Notes                          |
| ---------------- | --------------- | ----------------------------------------------------- | ------------------------------ |
| `id`             | `VARCHAR(100)`  | PK                                                    | String ID, not UUID            |
| `badge`          | `VARCHAR(255)`  |                                                       | Badge label                    |
| `icon`           | `VARCHAR(100)`  |                                                       | Icon name                      |
| `title`          | `VARCHAR(255)`  | NOT NULL                                              |                                |
| `bullets`        | `TEXT[]`        |                                                       | Feature bullets                |
| `numeric_price`  | `NUMERIC(12,2)` | NOT NULL                                              | Sortable price value           |
| `strike_price`   | `NUMERIC(12,2)` |                                                       | Original price                 |
| `discount_percent` | `INTEGER`     |                                                       |                                |
| `valid_till`     | `TIMESTAMPTZ`   |                                                       |                                |
| `used_count_value` | `INTEGER`     | DEFAULT 0                                             | Sortable count value           |
| `image`          | `TEXT`          |                                                       | Image path or URL              |
| `categories`     | `TEXT[]`        |                                                       | e.g. Car Care, Service         |
| `is_combo`       | `BOOLEAN`       | DEFAULT false                                         | Combo package flag             |
| `relevance`      | `INTEGER`       | DEFAULT 0                                             | Sort order weight              |
| `theme_preset`   | `VARCHAR(50)`   | NOT NULL, DEFAULT 'blue', CHECK (`orange`, `green`, `blue`, `purple`, `red`) | UI theme |
| `created_at`     | `TIMESTAMPTZ`   | NOT NULL, DEFAULT NOW()                               |                                |

**Seed**: 8 promo rows (summer/monsoon/winter/festival combos, wash, brake, AC offers)

---

## 9. Authentication *(not in schema.md — added in migration 002)*

### `refresh_tokens`

| Column       | Type           | Constraints                                  | Notes                |
| ------------ | -------------- | -------------------------------------------- | -------------------- |
| `id`         | `UUID`         | PK, DEFAULT `uuid_generate_v4()`             |                      |
| `user_id`    | `UUID`         | NOT NULL, FK → `users(id)` ON DELETE CASCADE |                      |
| `token_hash` | `VARCHAR(255)` | NOT NULL, UNIQUE                             | Hashed refresh token |
| `expires_at` | `TIMESTAMPTZ`  | NOT NULL                                     |                      |
| `created_at` | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                      |                      |

**Indexes**: `user_id`

---

## 10. Diagnose UI Config *(added in migration 013)*

Static UI configuration tables migrated from hardcoded frontend values.

### `diagnose_issue_categories`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(100)` | PK | e.g. `engine_noise`, `ac_not_cooling` |
| `label` | `VARCHAR(255)` | NOT NULL | Display name |
| `summary` | `TEXT` | NOT NULL | Short description |
| `summary_meaning` | `TEXT` | NOT NULL | Explanation of why it matters |
| `keywords` | `TEXT[]` | NOT NULL, DEFAULT '{}' | Search terms for matching |
| `sort_order` | `INTEGER` | NOT NULL, DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Seed**: 6 categories (engine_noise, ac_not_cooling, brake_vibration, low_pickup, starting_issue, steering_suspension)

---

### `diagnose_questions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(100)` | PK | |
| `category_id` | `VARCHAR(100)` | NOT NULL, FK → `diagnose_issue_categories(id)` ON DELETE CASCADE | |
| `label` | `VARCHAR(255)` | NOT NULL | Short label for UI |
| `question` | `TEXT` | NOT NULL | Full question text |
| `options` | `TEXT[]` | NOT NULL, DEFAULT '{}' | Answer options |
| `sort_order` | `INTEGER` | NOT NULL, DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `category_id`
**Seed**: 24 questions (4 per category)

---

### `diagnose_possible_issues`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(100)` | PK | |
| `category_id` | `VARCHAR(100)` | NOT NULL, FK → `diagnose_issue_categories(id)` ON DELETE CASCADE | |
| `title` | `VARCHAR(255)` | NOT NULL | |
| `badge` | `VARCHAR(100)` | NOT NULL | e.g. "High Match", "Low Match" |
| `badge_class` | `VARCHAR(255)` | NOT NULL | Tailwind classes |
| `description` | `TEXT` | NOT NULL | |
| `match_score` | `INTEGER` | NOT NULL, CHECK (0–100) | |
| `risks` | `TEXT[]` | NOT NULL, DEFAULT '{}' | |
| `estimated_cost` | `VARCHAR(100)` | NOT NULL | Formatted cost string |
| `image_src` | `TEXT` | NOT NULL | Image path |
| `sort_order` | `INTEGER` | NOT NULL, DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Indexes**: `category_id`
**Seed**: 18 issues (3 per category)

---

### `diagnose_result_summaries`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(100)` | PK | |
| `title` | `VARCHAR(255)` | NOT NULL | |
| `heading` | `TEXT` | NOT NULL | |
| `body` | `TEXT` | NOT NULL, DEFAULT '' | |
| `pill` | `VARCHAR(100)` | NOT NULL | Label badge |
| `pill_class` | `VARCHAR(255)` | NOT NULL | Tailwind classes |
| `icon` | `VARCHAR(100)` | NOT NULL | Lucide icon name |
| `icon_class` | `VARCHAR(255)` | NOT NULL | Tailwind classes |
| `sort_order` | `INTEGER` | NOT NULL, DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Seed**: 3 rows (top concern, other issues, what this means)

---

### `diagnose_next_steps`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(100)` | PK | |
| `step_number` | `VARCHAR(10)` | NOT NULL | e.g. "01" |
| `title` | `VARCHAR(255)` | NOT NULL | |
| `body` | `TEXT` | NOT NULL | |
| `meta` | `VARCHAR(255)` | NOT NULL | e.g. "Within 30 mins" |
| `sort_order` | `INTEGER` | NOT NULL, DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Seed**: 4 steps (Get Quotes → Compare → Book → Service)

---

### `diagnose_trust_items`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(100)` | PK | |
| `title` | `VARCHAR(255)` | NOT NULL | |
| `description` | `TEXT` | NOT NULL | |
| `icon` | `VARCHAR(100)` | NOT NULL | Lucide icon name |
| `sort_order` | `INTEGER` | NOT NULL, DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Seed**: 4 items (100% Free, Trusted Garages, Best Price, Secure)

---

## 11. Global Index Notes

| Index | Type | Purpose |
|-------|------|---------|
| `garages.specializations` | GIN | Array contains queries |
| `known_issues.symptom_keywords` | GIN | Array contains queries |
| `known_issues.makes` | GIN | Array contains queries |
| `user_roles(user_id, role_id)` | UNIQUE | One role per user |
| `reviews.booking_id` | UNIQUE | One review per booking |
| `inventory.product_id` | UNIQUE | One inventory row per product |
| `payments.provider_intent_id` | UNIQUE | Idempotent payment tracking |
| `orders.order_number` | UNIQUE | Order number uniqueness |
| `diagnose_questions.category_id` | B-tree | FK lookup for questions by category |
| `diagnose_possible_issues.category_id` | B-tree | FK lookup for issues by category |

---

## 12. Triggers

`update_updated_at_column()` auto-sets `updated_at = NOW()` on UPDATE for:

`users`, `roles`, `user_roles`, `vehicles`, `garages`, `bookings`, `products`, `inventory`, `carts`, `orders`, `payments`

**Not triggered on** (no `updated_at` column or no trigger defined): `vehicle_service_history`, `diagnosis_requests`, `diagnosis_media`, `diagnosis_results`, `garage_documents`, `garage_slots`, `quote_requests`, `quotes`, `sellers`, `reviews`, `garage_badges`, `notifications`, `refresh_tokens`, `known_issues`, `promos`, `diagnose_issue_categories`, `diagnose_questions`, `diagnose_possible_issues`, `diagnose_result_summaries`, `diagnose_next_steps`, `diagnose_trust_items`

---

## 13. Seeded Data Summary

| Migration | What's Seeded |
|-----------|---------------|
| `001` | 4 roles: customer, garage, vendor, admin |
| `004` | 18 known_issues across 6 categories |
| `005` | 1 test customer user, 1 Honda City vehicle, 1 service history |
| `006` | 1 garage owner user, 7 garages, 8 promos |
| `007` | 1 garage, 1 quote request, 8 quotes with detail breakdowns |
| `008` | 2 bookings (1 instant/confirmed, 1 quoteBased/completed) |
| `009` | Garages: added `starting_price`, `distance_km`, `badge`, `tone`, `artwork`, `image` columns + seed data |
| `010` | Garages: dropped `tone` and `artwork` columns |
| `011` | Garages: added `response_mins` column (DEFAULT 30) + per-garage response times |
| `012` | 12 garages with full metadata (distance, response time, badges, images) — replaces earlier 7+1 seed |
| `013` | 6 diagnose UI config tables: `diagnose_issue_categories`, `diagnose_questions`, `diagnose_possible_issues`, `diagnose_result_summaries`, `diagnose_next_steps`, `diagnose_trust_items` |
| `014` | Diagnose UI config: 6 categories, 24 questions, 18 possible issues, 3 summaries, 4 next steps, 4 trust items |

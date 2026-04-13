# schema.md
# WRECTIFAI Schema Specification (MVP)

## 1. Conventions
- Primary key type: UUID (unless integration requires provider-native IDs).
- Timestamps: `created_at`, `updated_at` in UTC.
- Role enum (product): `user`, `garage`, `vendor`, `admin`.
- Role enum (phase-1 implementation in task.md): `user`, `garage`, `admin`.
- Status enums are stored as constrained text/enums.

## 2. Entities and Field Definitions

### 2.0 runtime_app_config
- `key`: varchar, PK
- `value_json`: jsonb, not null
- `description`: text, nullable
- `updated_by`: UUID, nullable
- `updated_at`: timestamp, not null

Examples:
- `app_identity` (app_name, logo_url, brand_tagline)
- `legal_links` (privacy_url, terms_url)
- `support_info` (support_email, support_phone)

### 2.0A runtime_ui_content
- `id`: UUID, PK
- `content_key`: varchar, not null
- `locale`: varchar, not null (e.g., `en-US`)
- `platform`: enum(`mobile`,`web`,`all`), default `all`
- `value_text`: text, not null
- `version`: int, default 1
- `is_active`: boolean, default true
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

Constraints:
- Unique (`content_key`, `locale`, `platform`, `version`).

### 2.0B runtime_feature_flags
- `key`: varchar, PK
- `enabled`: boolean, not null
- `rules_json`: jsonb, nullable
- `updated_at`: timestamp, not null

### 2.0C runtime_workflow_definitions
- `id`: UUID, PK
- `workflow_key`: varchar, not null
- `version`: int, not null
- `definition_json`: jsonb, not null
- `is_active`: boolean, default true
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

Constraints:
- Unique (`workflow_key`, `version`).

### 2.0D seed_diagnosis
- `id`: UUID, PK
- `issue_code`: varchar, not null
- `symptom_tags`: text[], not null
- `urgency`: enum(`low`,`medium`,`high`), not null
- `diy_allowed`: boolean, not null
- `risk_text`: text, not null
- `suggested_parts_json`: jsonb, nullable
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.0E seed_price
- `id`: UUID, PK
- `service_code`: varchar, not null
- `vehicle_segment`: varchar, nullable
- `location_code`: varchar, nullable
- `price_min`: numeric(12,2), not null
- `price_max`: numeric(12,2), not null
- `currency`: char(3), default `USD`
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.0F seed_parts
- `id`: UUID, PK
- `part_code`: varchar, not null
- `name`: varchar, not null
- `category`: varchar, nullable
- `baseline_price`: numeric(12,2), nullable
- `currency`: char(3), default `USD`
- `metadata_json`: jsonb, nullable
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.1 users
- `id`: UUID, PK, not null
- `role`: enum(role), not null
- `phone`: varchar, nullable (required for OTP users)
- `email`: varchar, nullable
- `full_name`: varchar, nullable (phase-1 compatibility with `task.md`)
- `social_provider`: enum(`google`,`apple`,`none`), default `none`
- `social_subject`: varchar, nullable
- `is_active`: boolean, default true
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

Constraints:
- Unique (`phone`) when present.
- Unique (`email`) when present.

### 2.2 profiles
- `id`: UUID, unique, nullable (phase-1 compatibility with `task.md` shape)
- `user_id`: UUID, PK, FK -> users.id
- `full_name`: varchar, not null
- `avatar_url`: varchar, nullable
- `bio`: text, nullable
- `notification_preferences`: jsonb, nullable
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.3 vehicles
- `id`: UUID, PK
- `user_id`: UUID, FK -> users.id, not null
- `make`: varchar, not null
- `model`: varchar, not null
- `year`: int, not null
- `fuel_type`: varchar, not null
- `mileage`: int, nullable
- `trim`: varchar, nullable
- `engine_type`: varchar, nullable
- `vin`: varchar, nullable
- `plate_number`: varchar, nullable
- `is_default`: boolean, default false
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

Constraints:
- `year` must be realistic vehicle year range.
- At most one default vehicle per user.

### 2.4 vehicle_repair_history
- `id`: UUID, PK
- `vehicle_id`: UUID, FK -> vehicles.id, not null
- `issue_summary`: text, not null
- `service_done`: text, not null
- `shop_name`: varchar, nullable
- `price_amount`: numeric(12,2), nullable
- `currency`: char(3), default `USD`
- `service_date`: date, not null
- `created_at`: timestamp, not null

### 2.5 garages
- `id`: UUID, PK
- `owner_user_id`: UUID, FK -> users.id, unique, not null
- `business_name`: varchar, not null
- `address_line`: varchar, not null
- `city`: varchar, not null
- `state`: varchar, not null
- `postal_code`: varchar, not null
- `specializations`: text[], not null
- `business_hours`: jsonb, not null
- `verification_status`: enum(`pending`,`approved`,`rejected`), default `pending`
- `is_approved`: boolean, generated/derived from `verification_status='approved'` (or stored for phase-1 compatibility)
- `supports_pickup_drop`: boolean, default false
- `trust_score`: numeric(5,2), nullable
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.6 garage_verification_documents
- `id`: UUID, PK
- `garage_id`: UUID, FK -> garages.id, not null
- `document_type`: enum(`license`,`certification`,`image`,`other`), not null
- `file_url`: varchar, not null
- `uploaded_at`: timestamp, not null

### 2.7 vendors
- `id`: UUID, PK
- `owner_user_id`: UUID, FK -> users.id, unique, not null
- `business_name`: varchar, not null
- `verification_status`: enum(`pending`,`approved`,`rejected`), default `pending`
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.8 issue_requests
- `id`: UUID, PK
- `customer_user_id`: UUID, FK -> users.id, not null
- `vehicle_id`: UUID, FK -> vehicles.id, not null
- `diagnosis_session_id`: UUID, nullable
- `summary`: text, not null
- `status`: enum(`open`,`quoted`,`booked`,`closed`,`cancelled`), default `open`
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.9 quotes
- `id`: UUID, PK
- `issue_request_id`: UUID, FK -> issue_requests.id, not null
- `garage_id`: UUID, FK -> garages.id, not null
- `parts_cost`: numeric(12,2), not null
- `labor_cost`: numeric(12,2), not null
- `total_cost`: numeric(12,2), not null
- `currency`: char(3), default `USD`
- `eta_note`: varchar, nullable
- `comparison_label`: enum(`below_market`,`fair`,`above_market`), nullable
- `status`: enum(`submitted`,`selected`,`withdrawn`,`rejected`), default `submitted`
- `created_at`: timestamp, not null

Constraints:
- One selected quote per issue request.

### 2.10 bookings
- `id`: UUID, PK
- `quote_id`: UUID, FK -> quotes.id, unique, not null
- `customer_user_id`: UUID, FK -> users.id, not null
- `garage_id`: UUID, FK -> garages.id, not null
- `appointment_time`: timestamp, not null
- `checkin_mode`: enum(`self_checkin`,`home_pickup`), not null
- `customer_note`: text, nullable
- `status`: enum(`booked`,`confirmed`,`in_service`,`completed`,`cancelled`), default `booked`
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.11 payments
- `id`: UUID, PK
- `booking_id`: UUID, FK -> bookings.id, unique, not null
- `provider`: varchar, not null
- `provider_payment_id`: varchar, not null
- `amount`: numeric(12,2), not null
- `currency`: char(3), default `USD`
- `status`: enum(`initiated`,`succeeded`,`failed`,`refunded`), not null
- `receipt_url`: varchar, nullable
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.12 reviews
- `id`: UUID, PK
- `booking_id`: UUID, FK -> bookings.id, unique, not null
- `customer_user_id`: UUID, FK -> users.id, not null
- `garage_id`: UUID, FK -> garages.id, not null
- `rating_overall`: int, not null
- `rating_price`: int, nullable
- `rating_quality`: int, nullable
- `rating_time`: int, nullable
- `rating_behavior`: int, nullable
- `feedback_text`: text, nullable
- `verified`: boolean, default true
- `created_at`: timestamp, not null

Constraints:
- Ratings are 1..5.
- Insert allowed only when booking status is `completed`.

### 2.13 complaints
- `id`: UUID, PK
- `booking_id`: UUID, FK -> bookings.id, not null
- `customer_user_id`: UUID, FK -> users.id, not null
- `garage_id`: UUID, FK -> garages.id, not null
- `category`: enum(`overcharging`,`poor_service`,`other`), not null
- `description`: text, not null
- `status`: enum(`open`,`in_review`,`resolved`,`rejected`), default `open`
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.14 parts
- `id`: UUID, PK
- `seller_type`: enum(`platform`,`garage`,`vendor`), not null
- `seller_ref_id`: UUID, not null
- `name`: varchar, not null
- `description`: text, nullable
- `price`: numeric(12,2), not null
- `currency`: char(3), default `USD`
- `stock_qty`: int, not null
- `is_diy_kit`: boolean, default false
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.15 orders
- `id`: UUID, PK
- `customer_user_id`: UUID, FK -> users.id, not null
- `status`: enum(`placed`,`paid`,`shipped`,`delivered`,`cancelled`), not null
- `total_amount`: numeric(12,2), not null
- `currency`: char(3), default `USD`
- `shipping_mode`: enum(`in_house`,`third_party`), not null
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

### 2.16 notifications
- `id`: UUID, PK
- `user_id`: UUID, FK -> users.id, not null
- `title`: varchar, not null
- `message`: text, not null
- `category`: enum(`system`,`bookings`,`reminders`), default `system`
- `is_read`: boolean, default false
- `created_at`: timestamp, not null
- `updated_at`: timestamp, not null

## 3. Core Relationship Summary
- `users 1:N vehicles`
- `vehicles 1:N vehicle_repair_history`
- `users 1:1 garages` (for garage owners)
- `users 1:1 vendors` (for vendor owners)
- `issue_requests 1:N quotes`
- `quotes 1:1 bookings` (selected quote)
- `bookings 1:1 payments`
- `bookings 1:1 reviews` (verified only)

## 4. Data Integrity Rules
- No booking can exist without selected quote.
- No completed booking review by non-booking user.
- No garage/vendor operational actions in `pending` or `rejected` verification status.
- No unsafe DIY content persisted for high-risk diagnosis categories.
- Runtime app identity, UI copy, and workflow labels must resolve from PostgreSQL runtime tables.
- Seed JSON files are only bootstrap inputs; authoritative runtime records are in `seed_*` PostgreSQL tables.

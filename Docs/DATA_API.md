# Data API Specification (MVP)

## Conventions
- Base path: `/api/v1`
- Auth: `Authorization: Bearer <token>`
- Response envelope:
  - success: `{ data, meta? }`
  - error: `{ error: { code, message, details? } }`

## RBAC Matrix (High Level)
- Customer: diagnosis, vehicles, own bookings/orders/reviews, quote requests
- Garage: garage profile, slots, quotes, assigned bookings, own products
- Vendor: own products/inventory/orders
- Admin: approvals, compliance, moderation, payments monitoring

RBAC identity source (mandatory):
- `users`
- `roles`
- `user_roles`

Rule:
- Role checks must use `user_roles` mappings only.
- Do not infer role from profile or business collections.

## 1. Auth
- `POST /auth/register` (public)
- `POST /auth/login` (public)
- `POST /auth/refresh` (auth)
- `POST /auth/logout` (auth)

## 2. Vehicle Management (Customer)
- `GET /vehicles`
- `POST /vehicles`
- `GET /vehicles/:vehicleId`
- `PATCH /vehicles/:vehicleId`
- `DELETE /vehicles/:vehicleId`

## 3. Diagnosis
- `POST /diagnosis` (customer)
  - input: vehicle_id + symptoms + media references
  - output: issue candidates, confidence, risk, diy steps(if safe)
- `GET /diagnosis/:diagnosisId` (owner/admin)
- `GET /diagnosis/:diagnosisId/recommendations` (owner)

## 4. Garage Discovery
- `GET /garages/search` (public/auth)
  - filters: lat,lng,distance,price_range,rating,specialization
- `GET /garages/:garageId` (public/auth)
- `GET /garages/:garageId/slots` (customer)

## 5. Garage Onboarding and Management
- `POST /garage/onboarding` (garage)
- `PATCH /garage/profile` (garage)
- `POST /garage/documents` (garage)
- `POST /garage/services` (garage)
- `PATCH /garage/services/:serviceId` (garage)

## 5.1 Vendor Onboarding and Management
- `POST /vendor/onboarding` (vendor)
- `PATCH /vendor/profile` (vendor)
- `POST /vendor/documents` (vendor)

## 6. Quote System
- `POST /quotes/requests` (customer)
- `GET /quotes/requests/:requestId` (owner, eligible garages, admin)
- `POST /quotes/requests/:requestId/quotes` (garage)
- `GET /quotes/requests/:requestId/quotes` (customer, admin)
- `POST /quotes/:quoteId/select` (customer owner)

## 7. Bookings
- `POST /bookings/instant` (customer)
- `POST /bookings/from-quote/:quoteId` (customer)
- `GET /bookings` (role scoped)
- `GET /bookings/:bookingId` (role scoped)
- `PATCH /bookings/:bookingId/status` (garage/admin)

## 8. Payments
- `POST /payments/intent` (customer)
- `POST /payments/confirm` (customer)
- `POST /payments/webhook` (gateway)
- `GET /payments/:paymentId` (owner/admin)

## 9. Marketplace
- `GET /products` (public/auth)
- `POST /products` (garage/vendor/admin seller)
- `PATCH /products/:productId` (owner/admin)
- `GET /products/:productId`
- `POST /cart/items` (customer)
- `GET /cart`
- `POST /orders/checkout` (customer)
- `GET /orders` (role scoped)
- `PATCH /orders/:orderId/fulfillment` (seller/admin)

## 9.1 Trust Badges
- `GET /garages/:garageId/badges` (public)
- `POST /admin/garages/:garageId/badges/recompute` (admin)

## 10. Reviews and Ratings
- `POST /bookings/:bookingId/review` (verified customer)
- `GET /garages/:garageId/reviews` (public)
- `PATCH /reviews/:reviewId/moderate` (admin)

## 11. Admin APIs
- `GET /admin/onboarding/garages` (admin)
- `POST /admin/onboarding/garages/:id/approve` (admin)
- `POST /admin/onboarding/garages/:id/reject` (admin)
- `GET /admin/onboarding/vendors` (admin)
- `POST /admin/onboarding/vendors/:id/approve` (admin)
- `GET /admin/transactions` (admin)
- `GET /admin/monetization/listing-fees` (admin)
- `GET /admin/subscriptions` (admin)

## 12. Permission Checks (Examples)
- Customer cannot patch another customer's vehicle.
- Garage cannot update quote not submitted by that garage.
- Vendor cannot read another vendor inventory write data.
- Admin-only moderation endpoints reject non-admin roles.

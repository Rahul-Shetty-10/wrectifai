# Application Flows

## Flow A: Customer Onboarding + Vehicle Setup
1. Customer signs up / logs in.
2. Customer completes profile.
3. Customer adds at least one vehicle (mandatory).
4. Vehicle context is stored and used by diagnosis and recommendation services.

## Flow B: Diagnosis -> DIY (Minor Issue)
1. Customer selects vehicle.
2. Customer submits symptoms (text/image/video/audio).
3. AI diagnosis runs and returns:
- issue candidates
- confidence score
- risk level
4. If risk level is `LOW`, DIY steps can be shown.
5. User can mark issue resolved or continue to garage booking.

## Flow C: Diagnosis -> Garage Booking (Major Issue)
1. Customer submits diagnosis input.
2. AI returns `MEDIUM/HIGH` risk.
3. System suppresses unsafe DIY guidance.
4. Customer is redirected to nearby garages with filters.
5. Customer chooses:
- Instant booking
- Quote request

## Flow D: Quote-Based Booking (Primary USP)
1. Customer creates quote request (vehicle, issue summary, preferred date/time, location).
2. Eligible garages receive request.
3. Garages submit quotes.
4. Customer compares and selects one quote.
5. Quote converts to booking.
6. Customer pays in-app.
7. Garage completes service.
8. Customer leaves review (verified only).

## Flow E: Instant Booking
1. Customer selects garage and slot.
2. Booking created in `PENDING_PAYMENT`.
3. Payment successful -> booking `CONFIRMED`.
4. Service progresses through statuses to completion.
5. Review becomes eligible.

## Flow F: Spare Parts Purchase
1. Customer receives AI part suggestions OR searches manually.
2. Customer applies filters (price/rating/compatibility).
3. Customer adds products to cart.
4. Checkout via in-app payment.
5. Fulfillment proceeds via in-house delivery OR third-party shipping integration.
6. Order tracking updates are sent to customer.

## Flow G: Garage Onboarding
1. Garage account created.
2. Profile + documents + certifications uploaded.
3. Admin verification review.
4. If approved, garage can publish services and accept work.
5. If rejected, reason is stored and resubmission allowed.

## Flow H: Vendor Onboarding
1. Vendor account created.
2. Verification details uploaded.
3. Admin approval required.
4. Approved vendor can list parts and manage inventory.

## Flow I: Review and Trust
1. Booking completed.
2. Customer can submit one review per completed booking.
3. System enforces verified-review rule.
4. Aggregates update garage rating and trust badges (Top Rated, Budget Friendly, EV Specialist).

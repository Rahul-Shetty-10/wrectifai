# APP_FLOW.md
# WRECTIFAI Application Flow

## 1. Actors
- Customer
- Garage (Rectifier)
- Vendor
- Admin

## 2. Global Preconditions
- User is authenticated via OTP or social login (Google/Apple).
- Vehicle onboarding is completed before diagnosis/booking actions.
- Garage and Vendor operational access requires admin approval.
- Client bootstraps runtime app config/content from PostgreSQL-backed APIs before rendering primary screens.
- No hardcoded UI copy is used for runtime screens.

## 3. End-to-End Flows

### 3.1 Customer Onboarding and Vehicle Setup
1. Customer signs in via phone OTP or social login.
2. Customer completes profile (name and basic details).
3. Customer adds at least one vehicle.
4. Customer can add VIN/Plate/RC for auto-population and must validate extracted values.
5. Vehicle becomes available for diagnosis, booking, and maintenance history.

State transitions:
- `anonymous -> authenticated -> onboarded_profile -> onboarded_vehicle -> active_customer`

### 3.2 Diagnosis to Fix (Minor/Safe Issue)
1. Customer selects a vehicle.
2. Customer submits symptom input (text/image/video/audio/common symptoms).
3. AI asks contextual follow-up questions.
4. AI returns one or more possible diagnoses with explanation, urgency, and risk if ignored.
5. If issue is safe/minor, system shows DIY steps and recommended parts.
6. Customer may purchase parts/DIY kits from marketplace.

Decision rules:
- High-risk issue: no DIY path.
- Multi-issue output: user chooses most relevant issue.

State transitions:
- `diagnosis_requested -> triage_in_progress -> diagnosis_ready -> diy_guidance_available`

### 3.3 Diagnosis to Booking and Completion (Primary USP)
1. Customer submits symptom input and receives AI diagnosis + draft quotation.
2. Customer raises an issue request.
3. Garages receive request and send quotes.
4. Customer compares quotes against AI fair price estimate (below/fair/above market labels).
5. AI recommends best quotation based on price, trust score, and related factors.
6. Customer selects garage and books appointment (self check-in or home pickup).
7. Customer pays in-app (card/Apple Pay/Google Pay).
8. Garage performs service and marks completion.
9. Customer leaves verified review and can report overcharging/poor service.

State transitions:
- `issue_raised -> quotes_pending -> quotes_received -> quote_selected -> appointment_booked -> payment_completed -> service_completed -> review_submitted`

### 3.4 Garage Lifecycle
1. Garage self-registers.
2. Garage submits documents/images/certifications.
3. Admin reviews and approves/rejects.
4. Approved garage configures profile, services, and availability slots.
5. Garage accepts/rejects bookings, sends quotes, and manages appointments.

State transitions:
- `garage_registered -> verification_pending -> approved|rejected -> active_garage`

### 3.5 Vendor Marketplace Lifecycle
1. Vendor registers and is approved by admin.
2. Vendor lists spare parts and manages inventory.
3. Orders are placed by customers.
4. Fulfillment occurs via in-house delivery or third-party shipping integration.

### 3.6 Admin Control Flow
1. Admin signs in.
2. Admin manages users/garages/vendors/bookings/quotes/payments/complaints.
3. Admin monitors analytics, trust metrics, and transaction health.
4. Admin controls paid ad space and loyalty/coupon operations.

## 4. Cross-Cutting Behaviors
- Notifications via SMS/email/push for OTP, quote updates, booking reminders, and status updates.
- Role-based access control: user, garage, vendor, admin.
- Only verified post-booking users can submit reviews.
- Payments are mandatory in-app for platform transactions.
- App identity, labels, workflow prompts, and lookup options are loaded from PostgreSQL runtime tables.

## 5. Exception Paths
- No quotes received: user retries request or broadens garage selection.
- Payment failure: booking remains unconfirmed until successful payment.
- Garage rejects booking: user selects another quote.
- Unsafe diagnosis category: redirect to garage booking path.

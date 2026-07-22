# Product Requirements Document

## Product Name: WRECTIFAI

---

## 1. Product Overview

WRECTIFAI is an AI-powered automotive assistance platform designed for the US market that enables users to:

- Diagnose vehicle issues using AI
- Get DIY guidance for minor problems
- Book trusted nearby garages (Rectifiers)
- Purchase spare parts and DIY kits
- Manage vehicle history and maintenance

The platform combines AI diagnostics, service marketplace, e-commerce, booking, and payments into a unified ecosystem.

---

## 2. Objectives

- Reduce friction in identifying vehicle issues
- Increase trust in garage selection
- Enable quick service booking and payments
- Create a marketplace for automotive parts
- Build a data-driven vehicle lifecycle platform

---

## 3. User Roles

### 3.1 Customers
- Diagnose issues
- Book garages
- Buy spare parts
- Manage vehicles

### 3.2 Garages (Rectifiers)
- Create profiles
- Accept bookings
- Offer services
- Sell parts

### 3.3 Vendors
- Sell spare parts
- Manage inventory

### 3.4 Admin
- Approve garages/vendors
- Manage platform
- Monitor transactions

---

## 4. Core Feature: AI Diagnosis Engine

### Input Methods
- Text symptoms
- Image upload
- Video upload
- Audio (engine sound)

### Output
- Basic diagnosis (problem identification)
- Confidence score (e.g., 75% probability)
- DIY steps (only for safe/minor issues)
- Redirect to garages (for critical issues)

### Rules
- No DIY guidance for high-risk issues
- AI uses stored vehicle history for better accuracy

---

## 5. Vehicle Management

- Mandatory onboarding step
- Users can:
  - Add multiple vehicles
  - Store service history
  - Add warranty details
- Used for:
  - AI context
  - Personalized recommendations

---

## 6. Garage (Rectifier) Ecosystem

### Onboarding
- Self-registration + Admin approval
- Verification via:
  - Documents
  - Images
  - Certifications

### Features
- Profile with:
  - Specializations (Engine, EV, etc.)
  - Certifications
- Availability & booking slots
- Optional pickup & drop service

### Booking Types
1. **Instant Booking**
2. **Quote-Based System (Primary USP)**
   - User raises request
   - Garages send quotes
   - User selects one

---

## 7. Payments & Monetization

### Payment Model
- Mandatory in-app payments

### Revenue Streams
- Commission per booking
- Listing fees for garages
- Spare parts sales
- Subscription:
  - Premium users
  - Premium garages

---

## 8. Spare Parts Marketplace

### Sellers
- Platform (first-party)
- Garages
- Third-party vendors

### Features
- AI-based part recommendations
- DIY kits (e.g., brake repair kits)
- Inventory + order management

### Logistics
- Flexible:
  - In-house delivery OR
  - Third-party shipping integrations

---

## 9. Ratings & Trust System

- Star ratings + detailed feedback:
  - Price
  - Quality
  - Time
  - Behavior
- Only verified users (post-booking) can review

### Badges
- Top Rated
- Budget Friendly
- EV Specialist

---

## 10. Discovery & Search

- Auto location detection + manual search

### Filters
- Distance
- Price
- Rating
- Specialization

---

## 11. Platform Scope

- Mobile App (Primary)
- Web App

### Geography
- US Market (initial launch)

---

## 12. Future Roadmap (Phase 2+)

- Predictive maintenance
- OBD / real-time diagnostics
- Chat with human mechanic
- Emergency roadside assistance (garage-dependent)
- Insurance integration

---

## 13. Integrations

- Maps (location & navigation)
- Payment gateway (US-supported like Stripe)
- Notifications (SMS / email / push)
- Future: Car data APIs

---

## 14. AI Architecture

- **Phase 1:**
  - LLM wrapper
- **Phase 2:**
  - Automotive-trained AI model
  - Improved diagnosis accuracy

---

## 15. Key Constraints & Policies

- No unsafe DIY suggestions
- Verified garage onboarding
- Secure payments only via platform
- Review authenticity enforcement

---

## 16. User Journey (Simplified)

### Flow 1: Diagnosis → Fix
1. User enters symptoms (text/image/audio/video)
2. AI provides diagnosis + confidence
3. If minor → DIY steps
4. If major → show garages

### Flow 2: Diagnosis → Booking
1. User gets issue
2. Chooses:
   - Instant booking OR
   - Quote-based request
3. Selects garage
4. Pays via app
5. Service completed
6. Leaves review

### Flow 3: Parts Purchase
1. AI suggests parts OR user searches
2. User purchases
3. Delivery fulfilled

---

## 17. MVP Scope

### Include
- AI diagnosis (basic)
- Garage onboarding + booking
- Quote system
- Payments
- Ratings
- Basic marketplace

### Exclude (later)
- Predictive maintenance
- Real-time diagnostics
- Insurance
- Roadside assistance
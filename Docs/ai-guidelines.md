# AI Development Guidelines - WRECTIFAI

**This document serves as the comprehensive guideline for AI assistants working on the WRECTIFAI project. All development work must adhere to these standards.**

---

## **Core Principles**

### **1. Dynamic Content from Database**
- **ALL text, labels, titles, descriptions, error messages, and UI content must be dynamic and fetched from the database/API**
- No hardcoded text strings in components unless they are technical/developer-only
- All user-facing content must be configurable via API
- Use props to pass all dynamic content from parent components
- Example: Instead of `<h1>Welcome Back</h1>`, use `<h1>{title}</h1>` where `title` is passed as a prop or fetched from API

### **2. UI Components - shadcn/ui Only**
- **ALL UI components must be from shadcn/ui library**
- Do not create custom UI components when shadcn/ui equivalents exist
- Available shadcn/ui components include: Button, Input, Label, Card, Dialog, Dropdown, Tabs, Table, etc.
- Custom components should only be created for business logic, not for UI primitives
- Use the existing shadcn/ui components in `apps/web/src/components/ui/`

### **3. Responsive Design - All Devices**
- **All pages and components must be fully responsive**
- Must work seamlessly on: Mobile, Tablet, Desktop, Large screens
- Use Tailwind CSS responsive classes: `sm:`, `md:`, `lg:`, `xl:`
- Test layouts on multiple screen sizes
- Use mobile-first approach when designing
- Ensure touch targets are at least 44x44 pixels on mobile
- Hide non-essential elements on smaller screens using `hidden lg:block` or similar patterns

### **4. Color Palette Compliance**
- **Use only the defined color palette from `global.css`**
- Do not use hardcoded color values (e.g., `#000000`, `rgb(255,0,0)`)
- Available color tokens:
  - `text-foreground`, `text-muted-foreground`, `text-primary`, `text-destructive`
  - `bg-background`, `bg-card`, `bg-sidebar`, `surface-low`, `surface-lowest`
  - `border-border`, `border-destructive`
  - `ring-ring`, `ring-primary`
- Use semantic color names that map to the design system

### **5. Form Validation Standards**
- All mandatory fields must be marked with an asterisk (*)
- Validation errors must appear in red color using `text-destructive`
- Invalid fields must have red border using `border-destructive`
- Error messages should be specific and helpful
- Use individual field error states, not just a single global error
- Clear validation feedback in real-time or on submit

### **6. Authentication & Authorization**
- All authentication flows use Phone + OTP
- No password-based authentication
- Role-based access control: User, Garage (Rectifier), Vendor, Admin
- Protected routes must check user role
- Session management via secure tokens

---

## **Feature-Specific Guidelines**

### **AI Diagnosis Flow**
- Input methods: Text, Image, Video, Audio
- Common symptom selectors: Noise, Vibration, Warning lights, Smell
- Guided diagnostic questions based on context
- Output must show:
  - Possible issues/services with explanation
  - Draft quotation with spare parts and pricing
  - Urgency level and risk if ignored
  - DIY steps (only for safe/minor issues)
  - Garage redirection (for critical issues)
- Multi-issue handling: Show multiple possible diagnoses
- No DIY guidance for high-risk issues

### **Quote System**
- User raises issue request
- Garages submit quotes
- AI generates fair price estimate before selection:
  - Price range (min-max)
  - Parts cost estimate
  - Labor cost estimate
  - Confidence level
- Quote comparison labels: Below market, Fair, Above market
- AI recommends best quotation based on: price, trust score, other factors
- User selects quote and proceeds to booking

### **Booking System**
- User selects a quote
- Books appointment with options:
  - Self check-in
  - Home pickup
- Garage can Accept/Reject bookings
- User can reschedule/cancel appointments
- Appointment reminders via notifications
- Booking history tracking

### **Vehicle Management**
- Mandatory onboarding step
- Required fields: Make, Model, Year, Fuel Type
- Optional fields: Mileage, Trim, Engine type, VIN/Chassis
- Features:
  - Add multiple vehicles
  - Upload VIN/Plate Number/RC for auto-population
  - Edit, delete, set default vehicle
  - Store past repair history
  - Add warranty details
  - Preventive maintenance suggestions based on mileage/time/past repairs
- Previous history not captured initially, AI asks during diagnosis

### **Payment System**
- Mandatory in-app payments only
- Supported methods: Card, Apple Pay, Google Pay
- Generate invoice/receipt
- View payment history
- Platform earns commission per booking
- Secure payment processing via payment gateway (Stripe for US)

### **Ratings & Trust System**
- Only verified users (post-booking) can submit reviews
- Star ratings + detailed feedback on:
  - Price
  - Quality
  - Time
  - Behavior
- Shop trust score based on:
  - Pricing consistency
  - Complaint rate
  - Reviews
- Badges: Top Rated, Budget Friendly, EV Specialist
- Report overcharging or poor service option

### **Garage (Rectifier) Features**
- Self-registration + Admin approval
- Verification via: Documents, Images, Certifications
- Profile setup:
  - Specializations (Engine, EV, etc.)
  - Business hours
  - Facility images/videos
  - Certifications
- Availability & booking slots
- Optional pickup & drop service
- Appointment management: Accept/Reject bookings
- Communication: User can call shop directly or message (optional in-app chat)
- Add vehicles (no edit/delete option)

### **Spare Parts Marketplace**
- Sellers: Platform (first-party), Garages, Third-party vendors
- AI-based part recommendations
- DIY kits (e.g., brake repair kits)
- Inventory + order management
- Logistics: In-house delivery OR third-party shipping

### **Discovery & Search**
- Auto location detection + manual search
- Provide directions and distance/travel time
- Filters:
  - Distance
  - Price
  - Rating
  - Specialization
  - Availability / Open now
- Search by: Service, Vehicle, Shop name
- Shop comparison side-by-side:
  - Best value
  - Most trusted
  - Closest
- Map view and List view
- AI Garage Recommender

---

## **Technical Standards**

### **File Structure**
- Follow Next.js App Router structure
- Components in `apps/web/src/components/`
- Pages in `apps/web/src/app/`
- Shared utilities in `apps/web/src/lib/`
- API calls in `apps/web/src/lib/api/`

### **Component Architecture**
- Use TypeScript for all components
- Define clear prop interfaces
- Use forwardRef for UI components
- Keep components small and focused
- Separate business logic from UI
- Use React hooks for state management
- Server components where possible (Next.js App Router)

### **State Management**
- Use React hooks (useState, useEffect, etc.) for local state
- For global state, consider Context API or Zustand
- API data fetching via server components or React Query
- Form state using controlled components

### **API Integration**
- All API calls through centralized API functions in `lib/api/`
- Use proper error handling
- Loading states for all async operations
- Type-safe API responses
- Credentials handling for authenticated requests

### **Error Handling**
- User-friendly error messages
- Error boundaries for React components
- Proper HTTP status code handling
- Logging for debugging (not exposed to users)
- Graceful degradation

### **Performance**
- Code splitting via Next.js automatic splitting
- Image optimization with Next.js Image component
- Lazy loading for heavy components
- Memoization where appropriate (React.memo, useMemo, useCallback)
- Optimize bundle size

### **Accessibility**
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Focus management

### **Security**
- Input validation and sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Secure authentication tokens
- Encrypted sensitive data
- Role-based access control
- No sensitive data in client-side code

---

## **Code Style**

### **Naming Conventions**
- Components: PascalCase (e.g., `RegisterForm`)
- Functions/Variables: camelCase (e.g., `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Files: kebab-case (e.g., `register-form.tsx`)
- CSS classes: Tailwind utility classes

### **Import Order**
1. React/Next.js imports
2. Third-party library imports
3. Internal component imports
4. Utility imports
5. Type imports

### **Comments**
- Comment complex logic
- Document component props with JSDoc
- Explain "why" not "what"
- Keep comments up to date

### **TypeScript**
- Use strict mode
- Avoid `any` type
- Define proper interfaces
- Use generic types where appropriate
- Export types for reuse

---

## **Testing Guidelines**

### **Unit Testing**
- Test utility functions
- Test custom hooks
- Test business logic
- Mock external dependencies

### **Integration Testing**
- Test API endpoints
- Test component integration
- Test user flows

### **E2E Testing**
- Test critical user journeys
- Test authentication flows
- Test payment flows
- Test cross-browser compatibility

---

## **Deployment & Environment**

### **Environment Variables**
- Never commit sensitive data
- Use `.env.local` for local development
- Document required environment variables
- Use different configs for dev/staging/prod

### **Build Process**
- Ensure build passes before deploying
- Run linting and type checking
- Optimize production build
- Test in staging environment first

---

## **Documentation**

### **Code Documentation**
- Update README when adding new features
- Document API endpoints
- Document component usage
- Keep changelog updated

### **User Documentation**
- User guides for new features
- Help center content
- FAQ updates
- Video tutorials if needed

---

## **Review Checklist**

Before submitting any code, verify:
- [ ] All text/content is dynamic from API
- [ ] Only shadcn/ui components used
- [ ] Responsive on all device sizes
- [ ] Uses defined color palette only
- [ ] Form validation with asterisks and red errors
- [ ] TypeScript strict mode compliant
- [ ] No console errors
- [ ] Accessibility checked
- [ ] Security reviewed
- [ ] Performance considered
- [ ] Tests passing
- [ ] Documentation updated

---

## **Common Pitfalls to Avoid**

- ❌ Hardcoding user-facing text
- ❌ Creating custom UI components when shadcn/ui exists
- ❌ Using hardcoded colors
- ❌ Ignoring mobile responsiveness
- ❌ Skipping form validation
- ❌ Exposing sensitive data
- ❌ Using `any` type
- ❌ Committing environment variables
- ❌ Ignoring error handling
- ❌ Not testing on multiple devices

---

## **AI Assistant Behavior**

When working on this project:
1. **Always** read existing code before making changes
2. **Always** use the existing patterns and conventions
3. **Always** make content dynamic from API
4. **Always** use shadcn/ui components
5. **Always** ensure responsive design
6. **Always** follow the defined color palette
7. **Always** add proper validation
8. **Always** handle errors gracefully
9. **Always** write TypeScript with proper types
10. **Always** test changes before submitting

---

**Last Updated:** April 14, 2026
**Version:** 1.0

import { query } from './postgres';

let bootstrapPromise: Promise<void> | null = null;

export function ensureDbBootstrap() {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        phone VARCHAR(10) UNIQUE NOT NULL,
        email TEXT,
        full_name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email TEXT;
    `);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
      ON users(email)
      WHERE email IS NOT NULL;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        avatar_url TEXT,
        bio TEXT,
        address_line TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        notification_preferences JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id)
      );
    `);

    await query(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS notification_preferences JSONB;
    `);

    await query(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS business_hours TEXT;
    `);

    await query(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS specializations JSONB;
    `);

    await query(`
      ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS certifications JSONB;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, role_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS user_social_accounts (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        social_subject TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (provider, social_subject),
        UNIQUE (user_id, provider)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token_hash TEXT UNIQUE NOT NULL,
        refresh_token_hash TEXT UNIQUE NOT NULL,
        role_code TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        refresh_expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INT NOT NULL,
        fuel_type TEXT NOT NULL,
        mileage INT,
        trim TEXT,
        engine_type TEXT,
        vin TEXT,
        plate_number TEXT,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_one_default_per_user
      ON vehicles(user_id)
      WHERE is_default = TRUE;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_user_created
      ON vehicles(user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS vehicle_repair_history (
        id UUID PRIMARY KEY,
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        issue_summary TEXT NOT NULL,
        service_done TEXT NOT NULL,
        shop_name TEXT,
        status TEXT NOT NULL DEFAULT 'Completed',
        price_amount NUMERIC(12,2),
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        service_date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      ALTER TABLE vehicle_repair_history
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Completed';
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_repair_history_vehicle_date
      ON vehicle_repair_history(vehicle_id, service_date DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS diagnosis_sessions (
        id UUID PRIMARY KEY,
        customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        symptoms_text TEXT,
        attachments JSONB,
        possible_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
        urgency TEXT NOT NULL DEFAULT 'low',
        diy_allowed BOOLEAN NOT NULL DEFAULT FALSE,
        risk_text TEXT NOT NULL DEFAULT '',
        next_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        draft_estimate_min NUMERIC(12,2),
        draft_estimate_max NUMERIC(12,2),
        status TEXT NOT NULL DEFAULT 'diagnosis_ready',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_diagnosis_sessions_user_created
      ON diagnosis_sessions(customer_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS issue_requests (
        id UUID PRIMARY KEY,
        customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        diagnosis_session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE SET NULL,
        summary TEXT NOT NULL,
        issue_source TEXT NOT NULL DEFAULT 'direct',
        issue_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      ALTER TABLE issue_requests
      ADD COLUMN IF NOT EXISTS issue_source TEXT NOT NULL DEFAULT 'direct';
    `);

    await query(`
      ALTER TABLE issue_requests
      ADD COLUMN IF NOT EXISTS issue_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_issue_requests_user_created
      ON issue_requests(customer_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS garages (
        id UUID PRIMARY KEY,
        owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_name TEXT NOT NULL,
        address_line TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        specializations JSONB,
        business_hours JSONB,
        verification_status TEXT DEFAULT 'pending',
        is_approved BOOLEAN DEFAULT FALSE,
        trust_score NUMERIC(3,2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (owner_user_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY,
        issue_request_id UUID NOT NULL REFERENCES issue_requests(id) ON DELETE CASCADE,
        garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
        parts_cost NUMERIC(12,2) NOT NULL,
        labor_cost NUMERIC(12,2) NOT NULL,
        total_cost NUMERIC(12,2) NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        eta_note TEXT,
        comparison_label TEXT NOT NULL DEFAULT 'fair',
        status TEXT NOT NULL DEFAULT 'submitted',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_quotes_issue_created
      ON quotes(issue_request_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY,
        quote_id UUID UNIQUE NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        garage_id UUID NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
        appointment_time TIMESTAMPTZ NOT NULL,
        checkin_mode TEXT NOT NULL DEFAULT 'self_checkin',
        customer_note TEXT,
        status TEXT NOT NULL DEFAULT 'booked',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Ensure garage_id column exists for existing databases
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS garage_id UUID REFERENCES garages(id) ON DELETE CASCADE`);
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkin_mode TEXT DEFAULT 'self_checkin'`);
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_note TEXT`);
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_created
      ON bookings(customer_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY,
        booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'paid',
        receipt_number TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_created
      ON payments(customer_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        id UUID PRIMARY KEY,
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        method TEXT NOT NULL DEFAULT 'card',
        status TEXT NOT NULL DEFAULT 'created',
        client_secret TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
        confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_payment_intents_user_created
      ON payment_intents(customer_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY,
        customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created
      ON support_tickets(customer_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS parts_catalog (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        in_stock BOOLEAN NOT NULL DEFAULT TRUE,
        supplier TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS part_orders (
        id UUID PRIMARY KEY,
        customer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        part_id UUID NOT NULL REFERENCES parts_catalog(id) ON DELETE RESTRICT,
        qty INT NOT NULL DEFAULT 1,
        total_amount NUMERIC(12,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'placed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_part_orders_user_created
      ON part_orders(customer_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS otp_challenges (
        id UUID PRIMARY KEY,
        phone VARCHAR(10) NOT NULL,
        purpose TEXT NOT NULL,
        role_code TEXT,
        full_name TEXT,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS sms_events (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        phone VARCHAR(10) NOT NULL,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        meta JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS runtime_app_config (
        key TEXT PRIMARY KEY,
        value_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS garage_services (
        id UUID PRIMARY KEY,
        garage_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        description TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_garage_services_garage
      ON garage_services(garage_user_id, created_at DESC);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ui_content (
        id SERIAL PRIMARY KEY,
        tenant_id TEXT NOT NULL DEFAULT 'default',
        module TEXT NOT NULL,
        page TEXT NOT NULL,
        locale TEXT NOT NULL,
        version INT NOT NULL DEFAULT 1,
        content JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, module, page, locale)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_ui_content_lookup
      ON ui_content (tenant_id, module, page, locale);
    `);

    await query(`
      DROP TABLE IF EXISTS runtime_ui_content;
    `);

    await seedDefaults();
  })();

  return bootstrapPromise;
}

async function seedDefaults() {
  await query(
    `
      INSERT INTO roles (id, code, name)
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'user', 'User'),
        ('22222222-2222-2222-2222-222222222222', 'garage', 'Garage'),
        ('33333333-3333-3333-3333-333333333333', 'vendor', 'Vendor'),
        ('44444444-4444-4444-4444-444444444444', 'admin', 'Admin')
      ON CONFLICT (code) DO NOTHING;
    `
  );

  await query(
    `
      INSERT INTO runtime_app_config (key, value_json)
      VALUES
      ('app_identity', '{"name":"WrectifAI","tagline":"Service. Quotes. Simplified.","logoUrl":"https://wrectifai.s3.ap-south-1.amazonaws.com/Assests+/Logo.jpeg"}'::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `
  );

  await query(
    `
      INSERT INTO ui_content (tenant_id, module, page, locale, version, content)
      VALUES
      (
        'default',
        'auth',
        'login',
        'en-US',
        1,
        '{
          "appName": "WrectifAI",
          "authModeLabel": "Phone + OTP authentication",
          "hero": {
            "kicker": "AUTOMOTIVE INTELLIGENCE",
            "title": "Experience Surgical Precision in Car Care.",
            "body": "Join the elite ecosystem of automotive specialists and car enthusiasts driving the future of service management."
          },
          "links": {
            "needAccountPrefix": "Need an account?",
            "needAccountCta": "Register"
          },
          "form": {
            "title": "Welcome Back",
            "subtitle": "Login with your 10-digit phone number.",
            "phoneLabel": "Phone Number *",
            "phonePlaceholder": "9876543210",
            "sendOtpLabel": "Send OTP",
            "sendingOtpLabel": "Sending OTP..."
          },
          "errors": {
            "phoneInvalid": "Phone number must be 10 digits",
            "sendOtpFailed": "Unable to send OTP",
            "unexpected": "Unexpected error"
          }
        }'::jsonb
      ),
      (
        'default',
        'auth',
        'register',
        'en-US',
        1,
        '{
          "appName": "WrectifAI",
          "authModeLabel": "Phone + OTP authentication",
          "hero": {
            "kicker": "AUTOMOTIVE INTELLIGENCE",
            "title": "Experience Surgical Precision in Car Care.",
            "body": "Join the elite ecosystem of automotive specialists and car enthusiasts driving the future of service management."
          },
          "links": {
            "haveAccountPrefix": "Already have an account?",
            "haveAccountCta": "Login"
          },
          "form": {
            "title": "Create Account",
            "subtitle": "Start your journey with WrectifAI precision today.",
            "fullNameLabel": "Full Name *",
            "fullNamePlaceholder": "John Doe",
            "phoneLabel": "Phone Number *",
            "phonePlaceholder": "9876543210",
            "termsLabel": "I agree to the Terms and Privacy Policy *",
            "createAccountLabel": "Create Account",
            "sendingOtpLabel": "Sending OTP..."
          },
          "errors": {
            "fullNameRequired": "Full name is required",
            "phoneInvalid": "Phone number must be 10 digits",
            "termsRequired": "Please accept terms to continue",
            "sendOtpFailed": "Unable to send OTP",
            "unexpected": "Unexpected error"
          }
        }'::jsonb
      ),
      (
        'default',
        'auth',
        'verify',
        'en-US',
        1,
        '{
          "appName": "WrectifAI",
          "authModeLabel": "Phone + OTP authentication",
          "hero": {
            "kicker": "AUTOMOTIVE INTELLIGENCE",
            "title": "Verify Your Secure Access.",
            "body": "Security check for your account session."
          },
          "links": {
            "backToPrefix": "Back to",
            "backToRegisterCta": "Register",
            "backToLoginCta": "Login"
          },
          "form": {
            "title": "Verify OTP",
            "subtitleTemplate": "Please enter 6 digit OTP sent to {phone}.",
            "otpLabel": "OTP",
            "otpPlaceholder": "Please enter 6 digit OTP",
            "ctaLabel": "Verify and Continue",
            "ctaLoadingLabel": "Verifying..."
          },
          "errors": {
            "otpInvalid": "OTP must be 6 digits",
            "verifyFailed": "Unable to verify OTP",
            "unexpected": "Unexpected error"
          }
        }'::jsonb
      ),
      (
        'default',
        'user',
        'sidebar',
        'en-US',
        1,
        '{
          "brandName": "PrecisionCurator",
          "brandTagline": "MASTER TECHNICIAN",
          "logoUrl": "https://wrectifai.s3.ap-south-1.amazonaws.com/Assests+/Logo.jpeg",
          "quickScanLabel": "Quick Scan",
          "nav": {
            "dashboard": "Dashboard",
            "my-garage": "My Garage",
            "ai-diagnosis": "AI Diagnosis",
            "quotes-bookings": "Quotes & Bookings",
            "spare-parts": "Spare Parts",
            "payments": "Payments",
            "settings": "Settings",
            "support": "Support"
          }
        }'::jsonb
      ),
      (
        'default',
        'user',
        'dashboard',
        'en-US',
        1,
        '{
          "kicker": "Service Hub",
          "title": "Dashboard",
          "description": "Track your complete service experience across diagnostics, bookings, and payments.",
          "emptyStateTitle": "Dashboard Insights Coming Soon",
          "emptyStateBody": "This section will show summary cards, pending tasks, and activity feed."
        }'::jsonb
      ),
      (
        'default',
        'user',
        'my-garage',
        'en-US',
        1,
        '{
          "topBar": {
            "sectionLabel": "Service Hub",
            "searchPlaceholder": "Search components, VINs or fleet...",
            "bookAppointmentLabel": "Book Appointment"
          },
          "header": {
            "title": "My Garage",
            "description": "Manage your fleet and track precision maintenance schedules with AI-driven insights.",
            "uploadRcLabel": "Upload RC",
            "addVehicleLabel": "Add New Vehicle",
            "activeFleetLabel": "Active Fleet",
            "serviceHistoryLabel": "Service History",
            "viewAllHistoryLabel": "View All History",
            "registerVehicleLabel": "Register Vehicle"
          },
          "fleetCards": [
            {
              "statusLabel": "Optimal",
              "vehicleName": "2022 BMW M3",
              "vehicleMeta": "Sedan - Alpine White",
              "completionPercentLabel": "98%"
            },
            {
              "statusLabel": "Service Due",
              "vehicleName": "2018 Toyota RAV4",
              "vehicleMeta": "SUV - Magnetic Gray",
              "completionPercentLabel": "62%"
            }
          ],
          "hero": {
            "title": "2022 BMW M3",
            "subtitle": "Competition Package - xDrive",
            "odometerLabel": "Current Odometer",
            "odometerValue": "12,482 mi"
          },
          "serviceHistory": [
            {
              "title": "Routine Oil Change",
              "subtitle": "Synthetic 0W-30 - BMW Service Center",
              "dateLabel": "Oct 12, 2023",
              "statusLabel": "Completed"
            },
            {
              "title": "Brake Pad Replacement",
              "subtitle": "Ceramic Front Pads - Specialized Auto",
              "dateLabel": "Aug 04, 2023",
              "statusLabel": "Completed"
            },
            {
              "title": "Tire Rotation & Balancing",
              "subtitle": "All 4 Wheels - Michelin Certified Service",
              "dateLabel": "Jun 15, 2023",
              "statusLabel": "Completed"
            }
          ],
          "promotion": {
            "title": "Extended Protection",
            "description": "Upgrade your drivetrain warranty for another 24 months with exclusive partner rates and peace of mind coverage.",
            "ctaLabel": "Explore Extensions"
          },
          "states": {
            "loadingVehiclesLabel": "Loading vehicles...",
            "noVehiclesLabel": "No vehicles found. Add your first vehicle.",
            "loadingHistoryLabel": "Loading service history...",
            "noHistoryLabel": "No service history yet for this vehicle."
          },
          "forms": {
            "addVehicleTitle": "Add New Vehicle",
            "rcInputLabel": "Upload RC Text",
            "rcInputPlaceholder": "Paste RC text here to auto-fill details...",
            "applyRcSuggestionLabel": "Apply RC Suggestion",
            "makeLabel": "Make *",
            "modelLabel": "Model *",
            "yearLabel": "Year *",
            "fuelTypeLabel": "Fuel Type *",
            "trimLabel": "Trim",
            "mileageLabel": "Mileage",
            "engineTypeLabel": "Engine Type",
            "vinLabel": "VIN",
            "plateLabel": "Plate Number",
            "saveVehicleLabel": "Save Vehicle",
            "cancelLabel": "Cancel",
            "selectVehicleLabel": "Select",
            "addVehicleSuccessLabel": "Vehicle added successfully.",
            "requiredFieldsErrorLabel": "Make, model, year, and fuel type are required.",
            "loadVehiclesErrorLabel": "Failed to load vehicles.",
            "loadHistoryErrorLabel": "Failed to load service history.",
            "processRcErrorLabel": "Failed to process RC.",
            "addVehicleErrorLabel": "Failed to add vehicle."
          }
        }'::jsonb
      ),
      (
        'default',
        'user',
        'ai-diagnosis',
        'en-US',
        1,
        '{
          "kicker": "Service Hub",
          "title": "AI Diagnosis",
          "description": "Describe issues and get guided, AI-powered diagnosis recommendations.",
          "emptyStateTitle": "AI Diagnosis Coming Soon",
          "emptyStateBody": "Symptom input, media upload, and guided checks will appear here."
        }'::jsonb
      ),
      (
        'default',
        'user',
        'quotes-bookings',
        'en-US',
        1,
        '{
          "kicker": "Service Hub",
          "title": "Quotes & Bookings",
          "description": "Compare garage quotations and manage your appointments in one place.",
          "emptyStateTitle": "Quotes & Bookings Coming Soon",
          "emptyStateBody": "Quote comparison and booking timeline modules will be added here."
        }'::jsonb
      ),
      (
        'default',
        'user',
        'spare-parts',
        'en-US',
        1,
        '{
          "kicker": "Service Hub",
          "title": "Spare Parts",
          "description": "Browse recommended parts and track part requests from your service flow.",
          "emptyStateTitle": "Spare Parts Marketplace Coming Soon",
          "emptyStateBody": "Parts catalog, filters, and order status components will be added here."
        }'::jsonb
      ),
      (
        'default',
        'user',
        'payments',
        'en-US',
        1,
        '{
          "kicker": "Service Hub",
          "title": "Payments",
          "description": "View invoices, receipts, and payment status for all your service orders.",
          "emptyStateTitle": "Payments Center Coming Soon",
          "emptyStateBody": "Invoice history, payment methods, and transaction details will be shown here."
        }'::jsonb
      ),
      (
        'default',
        'user',
        'settings',
        'en-US',
        1,
        '{
          "kicker": "Service Hub",
          "title": "Settings",
          "description": "Manage profile preferences, notifications, and app-level configurations.",
          "emptyStateTitle": "Settings Panel Coming Soon",
          "emptyStateBody": "Account and preference controls will be available in this section."
        }'::jsonb
      ),
      (
        'default',
        'user',
        'support',
        'en-US',
        1,
        '{
          "kicker": "Service Hub",
          "title": "Support",
          "description": "Get help, raise issues, and connect with service support quickly.",
          "emptyStateTitle": "Support Center Coming Soon",
          "emptyStateBody": "Help topics, ticket tracking, and support contact options will be available here."
        }'::jsonb
      )
      ON CONFLICT (tenant_id, module, page, locale)
      DO NOTHING;
    `
  );

  await query(`
    INSERT INTO ui_content (tenant_id, module, page, locale, version, content)
    VALUES
    (
      'default',
      'user',
      'dashboard',
      'en-US',
      1,
      '{
        "hero": {
          "welcomePrefix": "Welcome back,",
          "userNameDefault": "Precision Driver",
          "description": "Monitor your fleet and manage your automotive service journey with WrectifAI."
        },
        "stats": {
          "activeVehicles": "Active Vehicles",
          "pendingQuotes": "Pending Quotes",
          "upcomingBookings": "Upcoming Bookings"
        },
        "actions": {
          "title": "Precision Operations",
          "diagnosis": {
            "title": "AI Diagnosis",
            "description": "Run a virtual checkup on your vehicle."
          },
          "garage": {
            "title": "My Garage",
            "description": "Manage your personal fleet."
          },
          "quotes": {
            "title": "Quotes Hub",
            "description": "Review and accept service offers."
          }
        }
      }'::jsonb
    ),
    (
      'default',
      'user',
      'ai-diagnosis',
      'en-US',
      1,
      '{
        "header": {
          "title": "AI Diagnostics",
          "description": "Describe the symptoms, add media if necessary, and our AI will formulate a preliminary diagnosis.",
          "subtitle": "Upload engine sounds, warning lights, or describe the issue below."
        },
        "input": {
          "symptomsLabel": "Describe Symptoms",
          "symptomsPlaceholder": "e.g., Car shakes at high speeds and steering wheel vibrates...",
          "uploadMediaLabel": "Upload Media (Image / Video / Audio)",
          "categoriesLabel": "Common Symptoms",
          "categories": ["Engine Noise","Vibration","Brake Squeak","Warning Light","Strange Smell","Fluid Leak"],
          "analyzeButtonLabel": "Analyze Symptoms",
          "analyzingLabel": "AI is analyzing your symptoms...",
          "addMoreSymptomsLabel": "+ Add More Context"
        },
        "results": {
          "title": "Diagnosis Report",
          "urgencyLabel": "Urgency",
          "riskLabel": "Risk if Ignored",
          "issueLabel": "Identified Issue",
          "solutionLabel": "Recommended Solution",
          "partsEstimateLabel": "Estimated Parts & Labor",
          "diyLabel": "DIY Friendly",
          "garageLabel": "Requires Garage",
          "bookGarageLabel": "Book Garage Now",
          "viewDiyLabel": "View DIY Steps"
        },
        "states": { "errorLabel": "Something went wrong during analysis." }
      }'::jsonb
    ),
    (
      'default',
      'user',
      'quotes-bookings',
      'en-US',
      1,
      '{
        "header": {
          "title": "Marketplace",
          "description": "Compare mechanic quotes and track your active bookings.",
          "tabs": { "quotes": "Active Quotes", "bookings": "My Bookings" }
        },
        "quotes": {
          "emptyStateTitle": "No Active Requests",
          "emptyStateDescription": "Submit an issue in AI Diagnosis or raise a direct request to receive quotations.",
          "requestSummaryLabel": "Issue Summary:",
          "quoteCountPrefix": "Quotations received:",
          "compareLabel": "Compare Pricing",
          "partsLabel": "Parts",
          "laborLabel": "Labor",
          "totalLabel": "Total",
          "distanceSuffix": "miles away",
          "bookNowLabel": "Accept & Book",
          "bestMatchBadge": "Best Match",
          "fairPriceBadge": "Fair Market Price",
          "aboveMarketBadge": "Above Market"
        },
        "bookings": {
          "emptyStateTitle": "No Active Bookings",
          "emptyStateDescription": "Accepted quotes appear here as tracked service appointments.",
          "appointmentLabel": "Appointment:",
          "checkInLabel": "Check-in:",
          "statusBooked": "Confirmed",
          "statusInService": "In Service",
          "statusCompleted": "Completed",
          "getDirectionsLabel": "Get Directions",
          "cancelBookingLabel": "Cancel Appointment"
        }
      }'::jsonb
    ),
    (
      'default',
      'user',
      'payments',
      'en-US',
      1,
      '{
        "header": {
          "title": "Payments & Billings",
          "description": "Review your complete service financial history and payment methods."
        },
        "stats": {
          "totalSpentLabel": "Lifetime Spent",
          "outstandingLabel": "Outstanding Balance",
          "creditsLabel": "Available Credits"
        },
        "transactions": {
          "title": "Transaction History",
          "description": "A detailed log of all service payments and part acquisitions.",
          "table": { "date": "Date", "service": "Service / Item", "amount": "Amount", "status": "Status" }
        },
        "methods": {
          "title": "Payment Methods",
          "addMethodLabel": "Add New Method",
          "expiryLabel": "Expires"
        }
      }'::jsonb
    )
    ON CONFLICT (tenant_id, module, page, locale)
    DO NOTHING;
  `);

  await query(`
    INSERT INTO parts_catalog (id, name, category, price, supplier, in_stock)
    VALUES
      ('aaaa0000-0000-0000-0000-000000000001', 'Premium Brake Pad Kit', 'Brakes', 129.00, 'WrectifAI Parts', TRUE),
      ('aaaa0000-0000-0000-0000-000000000002', 'Synthetic Oil + Filter Combo', 'Maintenance', 59.00, 'WrectifAI Parts', TRUE),
      ('aaaa0000-0000-0000-0000-000000000003', 'All-Season Tire (Single)', 'Tires', 189.00, 'MetroDrive Supply', TRUE)
    ON CONFLICT (id) DO NOTHING;
  `);

  await query(`
    WITH ranked_vehicles AS (
      SELECT
        v.user_id,
        v.id AS vehicle_id,
        ROW_NUMBER() OVER (
          PARTITION BY v.user_id
          ORDER BY v.is_default DESC, v.created_at DESC
        ) AS rn
      FROM vehicles v
    ),
    selected_vehicles AS (
      SELECT user_id, vehicle_id
      FROM ranked_vehicles
      WHERE rn = 1
    ),
    issue_templates AS (
      SELECT *
      FROM (
        VALUES
          (1, 'Brake pedal feels soft and stopping distance increased'),
          (2, 'Engine knocking sound during cold start'),
          (3, 'AC cooling is weak in city traffic'),
          (4, 'Oil change and routine periodic maintenance required')
      ) AS t(seq, summary)
    ),
    prepared_issues AS (
      SELECT
        (
          SUBSTRING(md5('seed-issue-' || sv.user_id::text || '-' || it.seq::text), 1, 8) || '-' ||
          SUBSTRING(md5('seed-issue-' || sv.user_id::text || '-' || it.seq::text), 9, 4) || '-' ||
          SUBSTRING(md5('seed-issue-' || sv.user_id::text || '-' || it.seq::text), 13, 4) || '-' ||
          SUBSTRING(md5('seed-issue-' || sv.user_id::text || '-' || it.seq::text), 17, 4) || '-' ||
          SUBSTRING(md5('seed-issue-' || sv.user_id::text || '-' || it.seq::text), 21, 12)
        )::uuid AS id,
        sv.user_id AS customer_user_id,
        sv.vehicle_id,
        it.summary
      FROM selected_vehicles sv
      CROSS JOIN issue_templates it
    )
    INSERT INTO issue_requests (
      id,
      customer_user_id,
      vehicle_id,
      summary,
      status
    )
    SELECT
      pi.id,
      pi.customer_user_id,
      pi.vehicle_id,
      pi.summary,
      'open'
    FROM prepared_issues pi
    WHERE NOT EXISTS (
      SELECT 1
      FROM issue_requests ir
      WHERE ir.customer_user_id = pi.customer_user_id
        AND ir.summary = pi.summary
    )
    ON CONFLICT (id) DO NOTHING;
  `);

  await query(`
    WITH target_issues AS (
      SELECT
        ir.id AS issue_request_id,
        ir.customer_user_id,
        ir.summary
      FROM issue_requests ir
      WHERE ir.summary IN (
        'Brake pedal feels soft and stopping distance increased',
        'Engine knocking sound during cold start',
        'AC cooling is weak in city traffic',
        'Oil change and routine periodic maintenance required'
      )
    ),
    quote_templates AS (
      SELECT *
      FROM (
        VALUES
          ('Precision Auto Works', 2.4::numeric, 145::numeric, 90::numeric, 1.00::numeric, 1.00::numeric, 'Can start tomorrow', 'below_market'),
          ('CarMotive Pro Garage', 4.1::numeric, 165::numeric, 110::numeric, 1.08::numeric, 1.10::numeric, 'Slot in 24 hours', 'fair'),
          ('MetroDrive Service Hub', 6.8::numeric, 188::numeric, 125::numeric, 1.18::numeric, 1.16::numeric, 'Same-day premium slot', 'above_market')
      ) AS q(garage_name, distance_miles, base_parts_cost, base_labor_cost, parts_vendor_factor, labor_vendor_factor, eta_note, comparison_label)
    ),
    garage_mapping AS (
      SELECT
        qt.garage_name,
        g.id AS garage_id
      FROM quote_templates qt
      LEFT JOIN garages g ON g.business_name = qt.garage_name
    ),
    prepared_quotes AS (
      SELECT
        (
          SUBSTRING(md5('seed-quote-' || ti.issue_request_id::text || '-' || (
            qt.garage_name || '-' ||
            CASE
              WHEN ti.summary ILIKE '%brake%' THEN 'brake'
              WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 'engine'
              WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 'ac'
              WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 'maintenance'
              ELSE 'general'
            END
          )), 1, 8) || '-' ||
          SUBSTRING(md5('seed-quote-' || ti.issue_request_id::text || '-' || (
            qt.garage_name || '-' ||
            CASE
              WHEN ti.summary ILIKE '%brake%' THEN 'brake'
              WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 'engine'
              WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 'ac'
              WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 'maintenance'
              ELSE 'general'
            END
          )), 9, 4) || '-' ||
          SUBSTRING(md5('seed-quote-' || ti.issue_request_id::text || '-' || (
            qt.garage_name || '-' ||
            CASE
              WHEN ti.summary ILIKE '%brake%' THEN 'brake'
              WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 'engine'
              WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 'ac'
              WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 'maintenance'
              ELSE 'general'
            END
          )), 13, 4) || '-' ||
          SUBSTRING(md5('seed-quote-' || ti.issue_request_id::text || '-' || (
            qt.garage_name || '-' ||
            CASE
              WHEN ti.summary ILIKE '%brake%' THEN 'brake'
              WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 'engine'
              WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 'ac'
              WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 'maintenance'
              ELSE 'general'
            END
          )), 17, 4) || '-' ||
          SUBSTRING(md5('seed-quote-' || ti.issue_request_id::text || '-' || (
            qt.garage_name || '-' ||
            CASE
              WHEN ti.summary ILIKE '%brake%' THEN 'brake'
              WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 'engine'
              WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 'ac'
              WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 'maintenance'
              ELSE 'general'
            END
          )), 21, 12)
        )::uuid AS id,
        ti.issue_request_id,
        gm.garage_id,
        ROUND(
          qt.base_parts_cost
          * CASE
              WHEN ti.summary ILIKE '%brake%' THEN 1.28
              WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 1.72
              WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 1.36
              WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 0.78
              ELSE 1.00
            END
          * qt.parts_vendor_factor
        , 2) AS parts_cost,
        ROUND(
          qt.base_labor_cost
          * CASE
              WHEN ti.summary ILIKE '%brake%' THEN 1.32
              WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 1.86
              WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 1.41
              WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 0.74
              ELSE 1.00
            END
          * qt.labor_vendor_factor
        , 2) AS labor_cost,
        ROUND(
          (
            qt.base_parts_cost
            * CASE
                WHEN ti.summary ILIKE '%brake%' THEN 1.28
                WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 1.72
                WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 1.36
                WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 0.78
                ELSE 1.00
              END
            * qt.parts_vendor_factor
          ) + (
            qt.base_labor_cost
            * CASE
                WHEN ti.summary ILIKE '%brake%' THEN 1.32
                WHEN ti.summary ILIKE '%engine%' OR ti.summary ILIKE '%knock%' THEN 1.86
                WHEN ti.summary ILIKE '%ac%' OR ti.summary ILIKE '%cool%' THEN 1.41
                WHEN ti.summary ILIKE '%oil%' OR ti.summary ILIKE '%maintenance%' THEN 0.74
                ELSE 1.00
              END
            * qt.labor_vendor_factor
          )
        , 2) AS total_cost,
        qt.eta_note,
        qt.comparison_label
      FROM target_issues ti
      CROSS JOIN quote_templates qt
      LEFT JOIN garage_mapping gm ON gm.garage_name = qt.garage_name
      WHERE gm.garage_id IS NOT NULL
    )
    INSERT INTO quotes (
      id,
      issue_request_id,
      garage_id,
      parts_cost,
      labor_cost,
      total_cost,
      currency,
      eta_note,
      comparison_label,
      status
    )
    SELECT
      pq.id,
      pq.issue_request_id,
      pq.garage_id,
      pq.parts_cost,
      pq.labor_cost,
      pq.total_cost,
      'USD',
      pq.eta_note,
      pq.comparison_label,
      'submitted'
    FROM prepared_quotes pq
    WHERE NOT EXISTS (
      SELECT 1
      FROM quotes q
      WHERE q.issue_request_id = pq.issue_request_id
        AND q.garage_id = pq.garage_id
    )
    ON CONFLICT (id) DO NOTHING;
  `);
}

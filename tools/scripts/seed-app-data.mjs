import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import ts from 'typescript';

const { Client } = pg;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(rootDir, '.env');

function loadEnvFile() {
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    process.env[key] ??= rawValue.replace(/^['"]|['"]$/g, '');
  }
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripExpression(node) {
  let current = node;

  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return name.getText();
}

function evaluate(node, constants = {}) {
  const current = stripExpression(node);

  if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
    return current.text;
  }

  if (ts.isNumericLiteral(current)) {
    return Number(current.text);
  }

  if (current.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (current.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (current.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (ts.isIdentifier(current)) {
    return constants[current.text] ?? current.text;
  }

  if (ts.isPropertyAccessExpression(current)) {
    return current.getText();
  }

  if (ts.isTemplateExpression(current)) {
    return current.templateSpans.reduce((text, span) => {
      const value = evaluate(span.expression, constants);
      return `${text}${value}${span.literal.text}`;
    }, current.head.text);
  }

  if (ts.isArrayLiteralExpression(current)) {
    return current.elements.map((element) => evaluate(element, constants));
  }

  if (ts.isObjectLiteralExpression(current)) {
    const output = {};

    for (const property of current.properties) {
      if (ts.isPropertyAssignment(property)) {
        output[propertyName(property.name)] = evaluate(property.initializer, constants);
      } else if (ts.isShorthandPropertyAssignment(property)) {
        output[property.name.text] = constants[property.name.text] ?? property.name.text;
      } else if (ts.isSpreadAssignment(property)) {
        Object.assign(output, evaluate(property.expression, constants));
      }
    }

    return output;
  }

  if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return `${evaluate(current.left, constants)}${evaluate(current.right, constants)}`;
  }

  return current.getText();
}

function readSource(relativePath) {
  const filePath = path.join(rootDir, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function extractVariables(relativePath, variableNames, constants = {}) {
  const sourceFile = readSource(relativePath);
  const values = {};
  const localConstants = { ...constants };

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const name = node.name.text;
      const initializer = stripExpression(node.initializer);

      if (
        ts.isStringLiteral(initializer) ||
        ts.isNoSubstitutionTemplateLiteral(initializer) ||
        ts.isNumericLiteral(initializer)
      ) {
        localConstants[name] = evaluate(initializer, localConstants);
      }

      if (variableNames.includes(name)) {
        values[name] = evaluate(initializer, localConstants);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return values;
}

function expandDeals(baseDeals) {
  return [
    ...baseDeals,
    ...baseDeals.map((deal, index) => ({
      ...deal,
      id: `${deal.id}-page2-${index}`,
      relevance: deal.relevance - 20,
    })),
    ...baseDeals.map((deal, index) => ({
      ...deal,
      id: `${deal.id}-page3-${index}`,
      relevance: deal.relevance - 40,
    })),
  ];
}

function moneyToNumber(value) {
  const match = String(value ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

async function createDatabaseIfMissing(databaseUrl) {
  const targetUrl = new URL(databaseUrl);
  const databaseName = targetUrl.pathname.replace(/^\//, '');

  if (!databaseName) {
    return;
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';
  const adminClient = new Client({
    connectionString: adminUrl.toString(),
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  await adminClient.connect();
  const existing = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [databaseName]
  );

  if (existing.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
    console.log(`Created database: ${databaseName}`);
  }

  await adminClient.end();
}

async function connectWithDatabaseCreation(databaseUrl) {
  const clientConfig = {
    connectionString: databaseUrl,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  };
  const client = new Client(clientConfig);

  try {
    await client.connect();
    return client;
  } catch (error) {
    if (error?.code !== '3D000') {
      throw error;
    }

    await createDatabaseIfMissing(databaseUrl);
    const retryClient = new Client(clientConfig);
    await retryClient.connect();
    return retryClient;
  }
}

async function ensureDomainSchema(client) {
  await client.query(`
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

    CREATE TABLE IF NOT EXISTS vehicles (
      "_id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      vin TEXT,
      mileage INTEGER,
      warranty JSONB,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS vehicles_vin_unique_idx
      ON vehicles (vin)
      WHERE vin IS NOT NULL;
    CREATE INDEX IF NOT EXISTS vehicles_customer_id_idx ON vehicles ("customerId");
    CREATE INDEX IF NOT EXISTS vehicles_created_at_idx ON vehicles ("createdAt");

    CREATE TABLE IF NOT EXISTS vehicle_service_history (
      "_id" TEXT PRIMARY KEY,
      "vehicleId" TEXT NOT NULL REFERENCES vehicles("_id") ON DELETE CASCADE,
      "serviceDate" TIMESTAMPTZ NOT NULL,
      description TEXT NOT NULL,
      "garageId" TEXT,
      cost NUMERIC,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS vehicle_service_history_vehicle_id_idx
      ON vehicle_service_history ("vehicleId");

    CREATE TABLE IF NOT EXISTS diagnosis_requests (
      "_id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      "vehicleId" TEXT NOT NULL,
      "symptomText" TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT diagnosis_requests_status_check CHECK (status IN ('received', 'processing', 'completed', 'failed'))
    );

    CREATE INDEX IF NOT EXISTS diagnosis_requests_customer_id_idx ON diagnosis_requests ("customerId");
    CREATE INDEX IF NOT EXISTS diagnosis_requests_vehicle_id_idx ON diagnosis_requests ("vehicleId");
    CREATE INDEX IF NOT EXISTS diagnosis_requests_status_idx ON diagnosis_requests (status);

    CREATE TABLE IF NOT EXISTS diagnosis_media (
      "_id" TEXT PRIMARY KEY,
      "diagnosisRequestId" TEXT NOT NULL REFERENCES diagnosis_requests("_id") ON DELETE CASCADE,
      "mediaType" TEXT NOT NULL,
      url TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT diagnosis_media_type_check CHECK ("mediaType" IN ('image', 'video', 'audio'))
    );

    CREATE INDEX IF NOT EXISTS diagnosis_media_request_id_idx
      ON diagnosis_media ("diagnosisRequestId");

    CREATE TABLE IF NOT EXISTS diagnosis_results (
      "_id" TEXT PRIMARY KEY,
      "diagnosisRequestId" TEXT NOT NULL UNIQUE REFERENCES diagnosis_requests("_id") ON DELETE CASCADE,
      issues JSONB NOT NULL,
      "confidenceScore" INTEGER NOT NULL,
      "riskLevel" TEXT NOT NULL,
      "diyAllowed" BOOLEAN NOT NULL DEFAULT false,
      "diySteps" TEXT[],
      "nextAction" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT diagnosis_results_risk_check CHECK ("riskLevel" IN ('low', 'medium', 'high', 'critical')),
      CONSTRAINT diagnosis_results_next_action_check CHECK ("nextAction" IN ('diy', 'bookGarage', 'buyParts'))
    );

    CREATE INDEX IF NOT EXISTS diagnosis_results_risk_level_idx ON diagnosis_results ("riskLevel");

    CREATE TABLE IF NOT EXISTS garages (
      "_id" TEXT PRIMARY KEY,
      "ownerUserId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      location JSONB,
      specializations TEXT[],
      certifications TEXT[],
      "pickupDropSupported" BOOLEAN NOT NULL DEFAULT false,
      "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
      "ratingAvg" NUMERIC,
      "ratingCount" INTEGER,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT garages_approval_status_check CHECK ("approvalStatus" IN ('pending', 'approved', 'rejected', 'suspended'))
    );

    CREATE INDEX IF NOT EXISTS garages_owner_user_id_idx ON garages ("ownerUserId");
    CREATE INDEX IF NOT EXISTS garages_approval_status_idx ON garages ("approvalStatus");

    CREATE TABLE IF NOT EXISTS garage_documents (
      "_id" TEXT PRIMARY KEY,
      "garageId" TEXT NOT NULL REFERENCES garages("_id") ON DELETE CASCADE,
      "docType" TEXT NOT NULL,
      "fileUrl" TEXT NOT NULL,
      "verificationStatus" TEXT NOT NULL DEFAULT 'approved',
      "reviewedBy" TEXT,
      "reviewedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT garage_documents_status_check CHECK ("verificationStatus" IN ('pending', 'approved', 'rejected'))
    );

    CREATE INDEX IF NOT EXISTS garage_documents_garage_id_idx ON garage_documents ("garageId");
    CREATE INDEX IF NOT EXISTS garage_documents_status_idx ON garage_documents ("verificationStatus");

    CREATE TABLE IF NOT EXISTS garage_slots (
      "_id" TEXT PRIMARY KEY,
      "garageId" TEXT NOT NULL REFERENCES garages("_id") ON DELETE CASCADE,
      "startAt" TIMESTAMPTZ NOT NULL,
      "endAt" TIMESTAMPTZ NOT NULL,
      "isAvailable" BOOLEAN NOT NULL DEFAULT true
    );

    CREATE INDEX IF NOT EXISTS garage_slots_garage_id_idx ON garage_slots ("garageId");
    CREATE INDEX IF NOT EXISTS garage_slots_start_at_idx ON garage_slots ("startAt");
    CREATE INDEX IF NOT EXISTS garage_slots_available_idx ON garage_slots ("isAvailable");

    CREATE TABLE IF NOT EXISTS quote_requests (
      "_id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      "vehicleId" TEXT NOT NULL,
      "diagnosisRequestId" TEXT,
      "issueSummary" TEXT NOT NULL,
      "preferredDate" TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'quoted',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT quote_requests_status_check CHECK (status IN ('open', 'quoted', 'selected', 'expired', 'cancelled'))
    );

    CREATE INDEX IF NOT EXISTS quote_requests_customer_id_idx ON quote_requests ("customerId");
    CREATE INDEX IF NOT EXISTS quote_requests_vehicle_id_idx ON quote_requests ("vehicleId");
    CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON quote_requests (status);

    CREATE TABLE IF NOT EXISTS quotes (
      "_id" TEXT PRIMARY KEY,
      "quoteRequestId" TEXT NOT NULL REFERENCES quote_requests("_id") ON DELETE CASCADE,
      "garageId" TEXT NOT NULL REFERENCES garages("_id") ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      "etaDays" INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT quotes_status_check CHECK (status IN ('active', 'selected', 'rejected', 'withdrawn'))
    );

    CREATE INDEX IF NOT EXISTS quotes_quote_request_id_idx ON quotes ("quoteRequestId");
    CREATE INDEX IF NOT EXISTS quotes_garage_id_idx ON quotes ("garageId");
    CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes (status);

    CREATE TABLE IF NOT EXISTS bookings (
      "_id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      "garageId" TEXT NOT NULL REFERENCES garages("_id") ON DELETE CASCADE,
      "vehicleId" TEXT NOT NULL,
      "quoteId" TEXT,
      "bookingType" TEXT NOT NULL,
      "scheduledAt" TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      "totalAmount" NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT bookings_type_check CHECK ("bookingType" IN ('instant', 'quoteBased')),
      CONSTRAINT bookings_status_check CHECK (status IN ('pendingPayment', 'confirmed', 'inService', 'completed', 'cancelled'))
    );

    CREATE INDEX IF NOT EXISTS bookings_customer_id_idx ON bookings ("customerId");
    CREATE INDEX IF NOT EXISTS bookings_garage_id_idx ON bookings ("garageId");
    CREATE INDEX IF NOT EXISTS bookings_vehicle_id_idx ON bookings ("vehicleId");
    CREATE INDEX IF NOT EXISTS bookings_scheduled_at_idx ON bookings ("scheduledAt");
    CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);

    CREATE TABLE IF NOT EXISTS sellers (
      "_id" TEXT PRIMARY KEY,
      "sellerType" TEXT NOT NULL,
      "userId" TEXT,
      "garageId" TEXT,
      "approvalStatus" TEXT NOT NULL DEFAULT 'approved',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT sellers_type_check CHECK ("sellerType" IN ('platform', 'garage', 'vendor')),
      CONSTRAINT sellers_status_check CHECK ("approvalStatus" IN ('pending', 'approved', 'rejected'))
    );

    CREATE INDEX IF NOT EXISTS sellers_type_idx ON sellers ("sellerType");
    CREATE INDEX IF NOT EXISTS sellers_user_id_idx ON sellers ("userId");
    CREATE INDEX IF NOT EXISTS sellers_garage_id_idx ON sellers ("garageId");
    CREATE INDEX IF NOT EXISTS sellers_approval_status_idx ON sellers ("approvalStatus");

    CREATE TABLE IF NOT EXISTS products (
      "_id" TEXT PRIMARY KEY,
      "sellerId" TEXT NOT NULL REFERENCES sellers("_id") ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      price NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      "isDiyKit" BOOLEAN NOT NULL DEFAULT false,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "compatibleVehicleRules" JSONB,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS products_seller_id_idx ON products ("sellerId");
    CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);
    CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
    CREATE INDEX IF NOT EXISTS products_diy_idx ON products ("isDiyKit");
    CREATE INDEX IF NOT EXISTS products_active_idx ON products ("isActive");

    CREATE TABLE IF NOT EXISTS inventory (
      "_id" TEXT PRIMARY KEY,
      "productId" TEXT NOT NULL UNIQUE REFERENCES products("_id") ON DELETE CASCADE,
      "qtyAvailable" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS inventory_qty_available_idx ON inventory ("qtyAvailable");

    CREATE TABLE IF NOT EXISTS carts (
      "_id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      items JSONB NOT NULL DEFAULT '[]',
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS carts_customer_id_idx ON carts ("customerId");

    CREATE TABLE IF NOT EXISTS orders (
      "_id" TEXT PRIMARY KEY,
      "customerId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      "orderNumber" TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pendingPayment',
      subtotal NUMERIC NOT NULL,
      "shippingCost" NUMERIC NOT NULL DEFAULT 0,
      tax NUMERIC NOT NULL DEFAULT 0,
      total NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      "fulfillmentMode" TEXT NOT NULL DEFAULT 'inHouse',
      "shippingAddress" JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT orders_status_check CHECK (status IN ('pendingPayment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
      CONSTRAINT orders_fulfillment_check CHECK ("fulfillmentMode" IN ('inHouse', 'thirdParty'))
    );

    CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders ("customerId");
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders ("createdAt");

    CREATE TABLE IF NOT EXISTS payments (
      "_id" TEXT PRIMARY KEY,
      "payerUserId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      "bookingId" TEXT,
      "orderId" TEXT,
      provider TEXT NOT NULL,
      "providerIntentId" TEXT NOT NULL UNIQUE,
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      status TEXT NOT NULL DEFAULT 'created',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT payments_status_check CHECK (status IN ('created', 'requiresAction', 'succeeded', 'failed', 'refunded'))
    );

    CREATE INDEX IF NOT EXISTS payments_payer_user_id_idx ON payments ("payerUserId");
    CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON payments ("bookingId");
    CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments ("orderId");
    CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments ("createdAt");

    CREATE TABLE IF NOT EXISTS reviews (
      "_id" TEXT PRIMARY KEY,
      "bookingId" TEXT NOT NULL UNIQUE,
      "customerId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      "garageId" TEXT NOT NULL REFERENCES garages("_id") ON DELETE CASCADE,
      "ratingOverall" INTEGER NOT NULL,
      "ratingPrice" INTEGER,
      "ratingQuality" INTEGER,
      "ratingTime" INTEGER,
      "ratingBehavior" INTEGER,
      comment TEXT,
      "isVerified" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS reviews_customer_id_idx ON reviews ("customerId");
    CREATE INDEX IF NOT EXISTS reviews_garage_id_idx ON reviews ("garageId");
    CREATE INDEX IF NOT EXISTS reviews_verified_idx ON reviews ("isVerified");

    CREATE TABLE IF NOT EXISTS garage_badges (
      "_id" TEXT PRIMARY KEY,
      "garageId" TEXT NOT NULL REFERENCES garages("_id") ON DELETE CASCADE,
      "badgeKey" TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      "awardedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT garage_badges_key_check CHECK ("badgeKey" IN ('topRated', 'budgetFriendly', 'evSpecialist'))
    );

    CREATE INDEX IF NOT EXISTS garage_badges_garage_id_idx ON garage_badges ("garageId");
    CREATE INDEX IF NOT EXISTS garage_badges_key_idx ON garage_badges ("badgeKey");

    CREATE TABLE IF NOT EXISTS notifications (
      "_id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users("_id") ON DELETE CASCADE,
      channel TEXT NOT NULL,
      "templateKey" TEXT NOT NULL,
      payload JSONB,
      status TEXT NOT NULL DEFAULT 'queued',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT notifications_channel_check CHECK (channel IN ('sms', 'email', 'push', 'inApp')),
      CONSTRAINT notifications_status_check CHECK (status IN ('queued', 'sent', 'failed'))
    );

    CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications ("userId");
    CREATE INDEX IF NOT EXISTS notifications_channel_idx ON notifications (channel);
    CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications (status);
    CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications ("createdAt");
  `);

  await client.query(`
    INSERT INTO roles ("_id", code, name)
    VALUES
      ('customer-role', 'customer', 'Customer'),
      ('garage-role', 'garage', 'Garage'),
      ('vendor-role', 'vendor', 'Vendor'),
      ('admin-role', 'admin', 'Admin')
    ON CONFLICT (code) DO NOTHING
  `);
}

async function ensureScreenSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS screen_category_items (
      "_id" TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      icon TEXT,
      href TEXT,
      image TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_maintenance_items (
      "_id" TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      due TEXT,
      icon TEXT,
      href TEXT,
      image TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_dashboard_overview_items (
      "_id" TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      value TEXT,
      description TEXT,
      cta TEXT,
      href TEXT,
      icon TEXT,
      colors TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_emergency_items (
      "_id" TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image TEXT,
      href TEXT,
      "imageClass" TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_promo_items (
      "_id" TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      eyebrow TEXT,
      price TEXT,
      "strikePrice" TEXT,
      discount TEXT,
      image TEXT,
      href TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_care_tips (
      "_id" TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      icon TEXT,
      href TEXT,
      image TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_featured_garages (
      "_id" TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      badge TEXT,
      rating TEXT,
      reviews INTEGER,
      location TEXT,
      distance TEXT,
      price TEXT,
      href TEXT,
      image TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_garage_cards (
      "_id" TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      badge TEXT,
      rating NUMERIC,
      reviews INTEGER,
      location TEXT,
      "distanceKm" NUMERIC,
      "responseMins" INTEGER,
      chips TEXT[],
      verified BOOLEAN,
      image TEXT,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_garage_filter_options (
      "_id" TEXT PRIMARY KEY,
      "filterKey" TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT NOT NULL,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE ("filterKey", value)
    );

    CREATE TABLE IF NOT EXISTS screen_deals (
      "_id" TEXT PRIMARY KEY,
      badge TEXT,
      title TEXT NOT NULL,
      "displayPrice" TEXT,
      "numericPrice" NUMERIC,
      "discountPercent" INTEGER,
      "validTill" TEXT,
      "usedCount" TEXT,
      image TEXT,
      categories TEXT[],
      "isCombo" BOOLEAN,
      relevance INTEGER,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_deal_filter_options (
      "_id" TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      "displayLabel" TEXT NOT NULL,
      icon TEXT,
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_quote_cards (
      "_id" TEXT PRIMARY KEY,
      status TEXT,
      garage TEXT NOT NULL,
      image TEXT,
      rating TEXT,
      reviews INTEGER,
      distance TEXT,
      price TEXT,
      savings TEXT,
      time TEXT,
      tag TEXT,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_quote_comparison_rows (
      "_id" TEXT PRIMARY KEY,
      section TEXT NOT NULL,
      label TEXT NOT NULL,
      "aiValue" TEXT,
      "quoteValues" JSONB NOT NULL,
      payload JSONB NOT NULL,
      "sortOrder" INTEGER NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_diagnosis_categories (
      "_id" TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      summary TEXT,
      "summaryMeaning" TEXT,
      keywords TEXT[],
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_diagnosis_questions (
      "_id" TEXT PRIMARY KEY,
      "categoryId" TEXT NOT NULL,
      label TEXT,
      question TEXT NOT NULL,
      options TEXT[],
      "sortOrder" INTEGER NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_diagnosis_possible_issues (
      "_id" TEXT PRIMARY KEY,
      "categoryId" TEXT NOT NULL,
      title TEXT NOT NULL,
      badge TEXT,
      description TEXT,
      match INTEGER,
      risks TEXT[],
      "estimatedCost" TEXT,
      "imageSrc" TEXT,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS screen_content_groups (
      "_id" TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      payload JSONB NOT NULL,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS deals (
      "_id" TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC NOT NULL DEFAULT 0,
      "displayPrice" TEXT,
      "discountPercent" INTEGER,
      "validTill" TEXT,
      image TEXT,
      payload JSONB NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function upsertJson(client, table, id, fields, payload) {
  const entries = Object.entries({ _id: id, ...fields, payload });
  const columns = entries.map(([key]) => `"${key}"`);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const updates = entries
    .filter(([key]) => key !== '_id')
    .map(([key]) => `"${key}" = EXCLUDED."${key}"`);

  updates.push('"updatedAt" = NOW()');

  await client.query(
    `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT ("_id")
      DO UPDATE SET ${updates.join(', ')}
    `,
    entries.map(([key, value]) =>
      value && typeof value === 'object' && (key === 'payload' || key === 'quoteValues')
        ? JSON.stringify(value)
        : value
    )
  );
}

async function upsertScreenGroup(client, key, title, payload) {
  await upsertJson(
    client,
    'screen_content_groups',
    `screen-group-${key}`,
    { key, title },
    payload
  );
}

async function getRoleId(client, code) {
  const result = await client.query('SELECT "_id" AS id FROM roles WHERE code = $1', [code]);
  return result.rows[0]?.id;
}

async function ensureUser(client, { id, name, email, role }) {
  await client.query(
    `
      INSERT INTO users ("_id", email, name, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'active', NOW(), NOW())
      ON CONFLICT ("_id")
      DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, "updatedAt" = NOW()
    `,
    [id, email, name]
  );

  const roleId = await getRoleId(client, role);

  if (roleId) {
    await client.query(
      `
        INSERT INTO user_roles ("_id", "userId", "roleId")
        VALUES ($1, $2, $3)
        ON CONFLICT ("userId", "roleId") DO NOTHING
      `,
      [`user-role-${id}-${role}`, id, roleId]
    );
  }
}

async function seedDomainGarages(client, garageCards) {
  for (const garage of garageCards) {
    const id = `garage-${slugify(garage.name)}`;
    const ownerUserId = `garage-owner-${slugify(garage.name)}`;
    const chips = garage.chips ?? [];

    await ensureUser(client, {
      id: ownerUserId,
      name: `${garage.name} Owner`,
      email: `${slugify(garage.name)}@garages.wrectifai.local`,
      role: 'garage',
    });

    await client.query(
      `
        INSERT INTO garages (
          "_id", "ownerUserId", name, address, location, specializations,
          certifications, "pickupDropSupported", "approvalStatus", "ratingAvg",
          "ratingCount", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', $9, $10, NOW(), NOW())
        ON CONFLICT ("_id")
        DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          specializations = EXCLUDED.specializations,
          certifications = EXCLUDED.certifications,
          "pickupDropSupported" = EXCLUDED."pickupDropSupported",
          "ratingAvg" = EXCLUDED."ratingAvg",
          "ratingCount" = EXCLUDED."ratingCount",
          "updatedAt" = NOW()
      `,
      [
        id,
        ownerUserId,
        garage.name,
        garage.location,
        JSON.stringify({ type: 'Point', coordinates: [] }),
        chips,
        garage.verified ? ['Verified Partner'] : [],
        chips.some((chip) => /pickup|pick|drop/i.test(chip)),
        garage.rating,
        garage.reviews,
      ]
    );

    if (garage.verified) {
      await client.query(
        `
          INSERT INTO garage_documents ("_id", "garageId", "docType", "fileUrl", "verificationStatus", "reviewedAt")
          VALUES ($1, $2, 'businessVerification', $3, 'approved', NOW())
          ON CONFLICT ("_id")
          DO UPDATE SET "fileUrl" = EXCLUDED."fileUrl", "verificationStatus" = 'approved', "reviewedAt" = NOW()
        `,
        [`garage-document-${slugify(garage.name)}`, id, `seed://documents/${slugify(garage.name)}`]
      );
    }

    const badgeKey =
      garage.badge === 'Top Rated'
        ? 'topRated'
        : garage.badge === 'Best Value'
          ? 'budgetFriendly'
          : null;

    if (badgeKey) {
      await client.query(
        `
          INSERT INTO garage_badges ("_id", "garageId", "badgeKey", active, "awardedAt")
          VALUES ($1, $2, $3, true, NOW())
          ON CONFLICT ("_id")
          DO UPDATE SET active = true, "awardedAt" = NOW()
        `,
        [`garage-badge-${slugify(garage.name)}-${badgeKey}`, id, badgeKey]
      );
    }

    const baseDate = new Date();
    for (let index = 0; index < 3; index += 1) {
      const startAt = new Date(baseDate.getTime() + (index + 1) * 24 * 60 * 60 * 1000);
      startAt.setHours(10 + index * 2, 0, 0, 0);
      const endAt = new Date(startAt.getTime() + 90 * 60 * 1000);

      await client.query(
        `
          INSERT INTO garage_slots ("_id", "garageId", "startAt", "endAt", "isAvailable")
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT ("_id")
          DO UPDATE SET "startAt" = EXCLUDED."startAt", "endAt" = EXCLUDED."endAt", "isAvailable" = true
        `,
        [`garage-slot-${slugify(garage.name)}-${index + 1}`, id, startAt.toISOString(), endAt.toISOString()]
      );
    }
  }
}

async function seedCustomerJourney(client, issueCategories, quoteCards) {
  const userResult = await client.query(
    'SELECT "_id" AS id FROM users WHERE "mobileNumber" = $1 LIMIT 1',
    [process.env.TEST_USER_PHONE ?? '+919876543210']
  );
  const customerId = userResult.rows[0]?.id;

  if (!customerId) {
    return;
  }

  const vehicleId = 'vehicle-demo-hyundai-creta';
  await client.query(
    `
      INSERT INTO vehicles ("_id", "customerId", make, model, year, mileage, warranty, "createdAt", "updatedAt")
      VALUES ($1, $2, 'Hyundai', 'Creta', 2021, 42500, $3, NOW(), NOW())
      ON CONFLICT ("_id")
      DO UPDATE SET mileage = EXCLUDED.mileage, warranty = EXCLUDED.warranty, "updatedAt" = NOW()
    `,
    [vehicleId, customerId, JSON.stringify({ provider: 'Hyundai Shield', policyNo: 'DEMO-2021-CRETA', expiry: '2027-04-30' })]
  );

  await client.query(
    `
      INSERT INTO vehicle_service_history ("_id", "vehicleId", "serviceDate", description, cost, "createdAt")
      VALUES
        ('service-history-demo-1', $1, NOW() - INTERVAL '90 days', 'Periodic service with oil and filter replacement', 3599, NOW()),
        ('service-history-demo-2', $1, NOW() - INTERVAL '35 days', 'Brake inspection and tyre rotation', 1299, NOW())
      ON CONFLICT ("_id") DO NOTHING
    `,
    [vehicleId]
  );

  const issues = issueCategories.find((category) => category.id === 'steering_suspension')?.possibleIssues ?? [];
  const diagnosisRequestId = 'diagnosis-demo-steering-vibration';

  await client.query(
    `
      INSERT INTO diagnosis_requests ("_id", "customerId", "vehicleId", "symptomText", status, "createdAt")
      VALUES ($1, $2, $3, 'Steering vibration at highway speeds', 'completed', NOW())
      ON CONFLICT ("_id")
      DO UPDATE SET "symptomText" = EXCLUDED."symptomText", status = 'completed'
    `,
    [diagnosisRequestId, customerId, vehicleId]
  );

  await client.query(
    `
      INSERT INTO diagnosis_results (
        "_id", "diagnosisRequestId", issues, "confidenceScore", "riskLevel",
        "diyAllowed", "diySteps", "nextAction", "createdAt"
      )
      VALUES ($1, $2, $3, 85, 'high', false, ARRAY[]::TEXT[], 'bookGarage', NOW())
      ON CONFLICT ("diagnosisRequestId")
      DO UPDATE SET issues = EXCLUDED.issues, "confidenceScore" = 85, "riskLevel" = 'high', "nextAction" = 'bookGarage'
    `,
    ['diagnosis-result-demo-steering-vibration', diagnosisRequestId, JSON.stringify(issues)]
  );

  const quoteRequestId = 'quote-request-demo-wheel-care';
  await client.query(
    `
      INSERT INTO quote_requests (
        "_id", "customerId", "vehicleId", "diagnosisRequestId", "issueSummary",
        "preferredDate", status, "createdAt"
      )
      VALUES ($1, $2, $3, $4, 'Wheel balancing and alignment inspection', NOW() + INTERVAL '1 day', 'quoted', NOW())
      ON CONFLICT ("_id")
      DO UPDATE SET "issueSummary" = EXCLUDED."issueSummary", status = 'quoted'
    `,
    [quoteRequestId, customerId, vehicleId, diagnosisRequestId]
  );

  for (const quote of quoteCards) {
    const garageId = `garage-${slugify(quote.garage)}`;
    const garageExists = await client.query('SELECT 1 FROM garages WHERE "_id" = $1', [garageId]);

    if (garageExists.rowCount === 0) {
      continue;
    }

    await client.query(
      `
        INSERT INTO quotes ("_id", "quoteRequestId", "garageId", amount, currency, "etaDays", status, "createdAt")
        VALUES ($1, $2, $3, $4, 'INR', 1, $5, NOW())
        ON CONFLICT ("_id")
        DO UPDATE SET amount = EXCLUDED.amount, status = EXCLUDED.status
      `,
      [
        `quote-${quote.id}`,
        quoteRequestId,
        garageId,
        moneyToNumber(quote.price),
        quote.status === 'expired' ? 'withdrawn' : 'active',
      ]
    );
  }
}

async function seedMarketplace(client, deals) {
  const sellerId = 'seller-platform-wrectifai';
  await client.query(
    `
      INSERT INTO sellers ("_id", "sellerType", "approvalStatus", "createdAt")
      VALUES ($1, 'platform', 'approved', NOW())
      ON CONFLICT ("_id") DO UPDATE SET "approvalStatus" = 'approved'
    `,
    [sellerId]
  );

  for (const deal of deals) {
    const primaryCategory = deal.categories?.[0] ?? 'Service';
    const productId = `product-${deal.id}`;

    await client.query(
      `
        INSERT INTO products (
          "_id", "sellerId", name, description, category, price, currency,
          "isDiyKit", "isActive", "compatibleVehicleRules", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'INR', $7, true, $8, NOW(), NOW())
        ON CONFLICT ("_id")
        DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
          price = EXCLUDED.price, "isDiyKit" = EXCLUDED."isDiyKit", "compatibleVehicleRules" = EXCLUDED."compatibleVehicleRules",
          "updatedAt" = NOW()
      `,
      [
        productId,
        sellerId,
        deal.title,
        (deal.bullets ?? []).join(' | '),
        primaryCategory,
        deal.numericPrice || moneyToNumber(deal.displayPrice),
        primaryCategory === 'Parts & Accessories',
        JSON.stringify({ source: 'deals-screen', dealId: deal.id, categories: deal.categories ?? [] }),
      ]
    );

    await client.query(
      `
        INSERT INTO inventory ("_id", "productId", "qtyAvailable", "updatedAt")
        VALUES ($1, $2, 25, NOW())
        ON CONFLICT ("productId")
        DO UPDATE SET "qtyAvailable" = 25, "updatedAt" = NOW()
      `,
      [`inventory-${deal.id}`, productId]
    );

    await client.query(
      `
        INSERT INTO deals ("_id", title, category, price, "displayPrice", "discountPercent", "validTill", image, payload, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT ("_id")
        DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, price = EXCLUDED.price,
          "displayPrice" = EXCLUDED."displayPrice", "discountPercent" = EXCLUDED."discountPercent",
          "validTill" = EXCLUDED."validTill", image = EXCLUDED.image, payload = EXCLUDED.payload, "updatedAt" = NOW()
      `,
      [
        `deal-${deal.id}`,
        deal.title,
        primaryCategory,
        deal.numericPrice || moneyToNumber(deal.displayPrice),
        deal.displayPrice,
        deal.discountPercent ?? 0,
        deal.validTill,
        deal.image,
        JSON.stringify(deal),
      ]
    );
  }
}

function collectScreenData() {
  const home = extractVariables('apps/web/src/components/home/data.tsx', [
    'categoryItems',
    'maintenanceItems',
    'garages',
    'seasonalDeals',
    'careTips',
    'overviewItems',
    'emergencyItems',
    'promoItems',
    'topNavIcons',
  ]);
  const quotes = extractVariables('apps/web/src/components/quotes/quotes-shared.ts', [
    'quoteContextDefaultIssueIds',
    'aiEstimatedQuoteRange',
    'quotesList',
  ]);
  const diagnosis = extractVariables('apps/web/src/components/ai-diagnose/issue-intake-config.ts', [
    'MAX_DIAGNOSE_QUESTIONS',
    'issueCategories',
    'fallbackCategoryQuestion',
  ]);
  const garagesPage = extractVariables('apps/web/src/pages/garages/garages-page.tsx', [
    'filterPills',
    'filterOptions',
    'sortOptions',
    'garages',
  ]);
  const dealsPage = extractVariables('apps/web/src/pages/deals/deals-page.tsx', [
    'dealFilters',
    'baseDeals',
    'filterPills',
    'filterOptions',
  ]);
  const compareQuotes = extractVariables('apps/web/src/pages/compare-quotes/compare-quotes-page.tsx', [
    'actionItems',
    'priceRows',
    'detailRows',
  ]);

  return {
    home,
    quotes,
    diagnosis,
    garagesPage,
    dealsPage: {
      ...dealsPage,
      deals: expandDeals(dealsPage.baseDeals ?? []),
    },
    compareQuotes,
  };
}

async function seedScreenTables(client, data) {
  for (const [index, item] of (data.home.categoryItems ?? []).entries()) {
    await upsertJson(client, 'screen_category_items', `category-${slugify(item.label)}`, {
      label: item.label,
      icon: item.icon,
      href: item.href,
      image: item.image,
      sortOrder: index,
    }, item);
  }

  for (const [index, item] of (data.home.maintenanceItems ?? []).entries()) {
    await upsertJson(client, 'screen_maintenance_items', `maintenance-${slugify(item.label)}`, {
      label: item.label,
      due: item.due,
      icon: item.icon,
      href: item.href,
      image: item.image,
      sortOrder: index,
    }, item);
  }

  for (const [index, item] of (data.home.overviewItems ?? []).entries()) {
    await upsertJson(client, 'screen_dashboard_overview_items', `overview-${slugify(item.title)}`, {
      title: item.title,
      value: item.value,
      description: item.description,
      cta: item.cta,
      href: item.href,
      icon: item.icon,
      colors: item.colors,
      sortOrder: index,
    }, item);
  }

  for (const [index, item] of (data.home.emergencyItems ?? []).entries()) {
    await upsertJson(client, 'screen_emergency_items', `emergency-${slugify(item.title)}`, {
      title: item.title,
      image: item.image,
      href: item.href,
      imageClass: item.imageClass,
      sortOrder: index,
    }, item);
  }

  for (const [index, item] of (data.home.promoItems ?? []).entries()) {
    await upsertJson(client, 'screen_promo_items', `promo-${slugify(item.title)}`, {
      title: item.title,
      eyebrow: item.eyebrow,
      price: item.price,
      strikePrice: item.strikePrice,
      discount: item.discount,
      image: item.image,
      href: item.href,
      sortOrder: index,
    }, item);
  }

  for (const [index, item] of (data.home.careTips ?? []).entries()) {
    await upsertJson(client, 'screen_care_tips', `care-tip-${index + 1}-${slugify(item.title).slice(0, 48)}`, {
      title: item.title,
      icon: item.icon,
      href: item.href,
      image: item.image,
      sortOrder: index,
    }, item);
  }

  for (const [index, item] of (data.home.garages ?? []).entries()) {
    await upsertJson(client, 'screen_featured_garages', `featured-garage-${slugify(item.name)}`, {
      name: item.name,
      badge: item.badge,
      rating: item.rating,
      reviews: item.reviews,
      location: item.location,
      distance: item.distance,
      price: item.price,
      href: item.href,
      image: item.image,
      sortOrder: index,
    }, item);
  }

  for (const item of data.garagesPage.garages ?? []) {
    await upsertJson(client, 'screen_garage_cards', `garage-card-${slugify(item.name)}`, {
      name: item.name,
      badge: item.badge,
      rating: item.rating,
      reviews: item.reviews,
      location: item.location,
      distanceKm: item.distanceKm,
      responseMins: item.responseMins,
      chips: item.chips,
      verified: item.verified,
      image: item.image,
    }, item);
  }

  for (const [filterKey, options] of Object.entries(data.garagesPage.filterOptions ?? {})) {
    for (const [index, option] of options.entries()) {
      await upsertJson(client, 'screen_garage_filter_options', `garage-filter-${filterKey}-${slugify(option.value)}`, {
        filterKey,
        value: option.value,
        label: option.label,
        sortOrder: index,
      }, option);
    }
  }

  for (const [index, item] of (data.dealsPage.deals ?? []).entries()) {
    await upsertJson(client, 'screen_deals', `screen-deal-${item.id}`, {
      badge: item.badge,
      title: item.title,
      displayPrice: item.displayPrice,
      numericPrice: item.numericPrice,
      discountPercent: item.discountPercent,
      validTill: item.validTill,
      usedCount: item.usedCount,
      image: item.image,
      categories: item.categories,
      isCombo: item.isCombo,
      relevance: item.relevance,
    }, { ...item, sortOrder: index });
  }

  for (const [index, item] of (data.dealsPage.dealFilters ?? []).entries()) {
    await upsertJson(client, 'screen_deal_filter_options', `deal-filter-${slugify(item.label)}`, {
      label: item.label,
      displayLabel: item.displayLabel,
      icon: item.icon,
      sortOrder: index,
    }, item);
  }

  for (const item of data.quotes.quotesList ?? []) {
    await upsertJson(client, 'screen_quote_cards', `quote-card-${item.id}`, {
      status: item.status,
      garage: item.garage,
      image: item.image,
      rating: item.rating,
      reviews: item.reviews,
      distance: item.distance,
      price: item.price,
      savings: item.savings,
      time: item.time,
      tag: item.tag,
    }, item);
  }

  for (const [index, row] of (data.compareQuotes.priceRows ?? []).entries()) {
    await upsertJson(client, 'screen_quote_comparison_rows', `quote-price-row-${slugify(row.label)}`, {
      section: 'price',
      label: row.label,
      aiValue: row.aiValue,
      quoteValues: row.quoteValues,
      sortOrder: index,
    }, row);
  }

  for (const [index, row] of (data.compareQuotes.detailRows ?? []).entries()) {
    await upsertJson(client, 'screen_quote_comparison_rows', `quote-detail-row-${slugify(row.label)}`, {
      section: 'detail',
      label: row.label,
      aiValue: row.aiValue,
      quoteValues: row.quoteValues,
      sortOrder: index,
    }, row);
  }

  for (const category of data.diagnosis.issueCategories ?? []) {
    await upsertJson(client, 'screen_diagnosis_categories', `diagnosis-category-${category.id}`, {
      label: category.label,
      summary: category.summary,
      summaryMeaning: category.summaryMeaning,
      keywords: category.keywords,
    }, category);

    for (const [index, question] of (category.questions ?? []).entries()) {
      await upsertJson(client, 'screen_diagnosis_questions', `diagnosis-question-${category.id}-${question.id}`, {
        categoryId: category.id,
        label: question.label,
        question: question.question,
        options: question.options,
        sortOrder: index,
      }, question);
    }

    for (const issue of category.possibleIssues ?? []) {
      await upsertJson(client, 'screen_diagnosis_possible_issues', `diagnosis-issue-${issue.id}`, {
        categoryId: category.id,
        title: issue.title,
        badge: issue.badge,
        description: issue.description,
        match: issue.match,
        risks: issue.risks,
        estimatedCost: issue.estimatedCost,
        imageSrc: issue.imageSrc,
      }, issue);
    }
  }

  await upsertScreenGroup(client, 'home-seasonal-deals', 'Home seasonal deals carousel', data.home.seasonalDeals ?? []);
  await upsertScreenGroup(client, 'top-nav-icons', 'Top nav icon links', data.home.topNavIcons ?? []);
  await upsertScreenGroup(client, 'garage-filter-pills', 'Garage filter pill definitions', data.garagesPage.filterPills ?? []);
  await upsertScreenGroup(client, 'garage-sort-options', 'Garage sort options', data.garagesPage.sortOptions ?? []);
  await upsertScreenGroup(client, 'deal-filter-options', 'Deal filter menu options', data.dealsPage.filterOptions ?? {});
  await upsertScreenGroup(client, 'quote-action-items', 'Quote action buttons', data.compareQuotes.actionItems ?? []);
  await upsertScreenGroup(client, 'diagnosis-settings', 'Diagnosis flow settings', {
    maxQuestions: data.diagnosis.MAX_DIAGNOSE_QUESTIONS,
    fallbackQuestion: data.diagnosis.fallbackCategoryQuestion,
  });
  await upsertScreenGroup(client, 'quote-context-defaults', 'Quote context defaults', {
    issueIds: data.quotes.quoteContextDefaultIssueIds,
    aiEstimatedQuoteRange: data.quotes.aiEstimatedQuoteRange,
  });
}

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing. Add it to .env first.');
  process.exit(1);
}

let client;

try {
  client = await connectWithDatabaseCreation(databaseUrl);
  const data = collectScreenData();

  await client.query('BEGIN');
  await ensureDomainSchema(client);
  await ensureScreenSchema(client);
  await seedScreenTables(client, data);
  await seedDomainGarages(client, data.garagesPage.garages ?? []);
  await seedMarketplace(client, data.dealsPage.deals ?? []);
  await seedCustomerJourney(client, data.diagnosis.issueCategories ?? [], data.quotes.quotesList ?? []);
  await client.query('COMMIT');

  console.log('Seeded screen content and domain tables:');
  console.log(`  dashboard categories: ${(data.home.categoryItems ?? []).length}`);
  console.log(`  maintenance items:    ${(data.home.maintenanceItems ?? []).length}`);
  console.log(`  garage cards:         ${(data.garagesPage.garages ?? []).length}`);
  console.log(`  deals:                ${(data.dealsPage.deals ?? []).length}`);
  console.log(`  quote cards:          ${(data.quotes.quotesList ?? []).length}`);
  console.log(`  diagnosis categories: ${(data.diagnosis.issueCategories ?? []).length}`);
} catch (error) {
  await client?.query('ROLLBACK').catch(() => {});

  if (error?.code === '28P01') {
    console.error('Postgres rejected the password in DATABASE_URL.');
    process.exit(1);
  }

  throw error;
} finally {
  await client?.end();
}

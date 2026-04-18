import crypto from 'node:crypto';
import { query } from './postgres';

export async function seedDatabase() {
  console.log('Seeding database with sample data...');
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // Check if roles exist, if not insert them
  const roleIds = {
    user: '11111111-1111-1111-1111-111111111111',
    garage: '22222222-2222-2222-2222-222222222222',
    vendor: '33333333-3333-3333-3333-333333333333',
    admin: '44444444-4444-4444-4444-444444444444',
  };

  await query(`
    INSERT INTO roles (id, code, name) VALUES
      ($1::uuid, 'user', 'User'),
      ($2::uuid, 'garage', 'Garage'),
      ($3::uuid, 'vendor', 'Vendor'),
      ($4::uuid, 'admin', 'Admin')
    ON CONFLICT (code) DO NOTHING
  `, [roleIds.user, roleIds.garage, roleIds.vendor, roleIds.admin]);

  // Fetch existing users or create new ones
  let userIds: Record<string, string> = {};

  const existingUsers = await query<{ id: string; phone: string; email: string }>('SELECT id, phone, email FROM users');
  const userMap = new Map(existingUsers.rows.map(u => [u.phone, u.id]));

  const userData = [
    { key: 'customer1', phone: '4155550123', email: 'john@example.com', name: 'John Smith' },
    { key: 'customer2', phone: '2135550456', email: 'jane@example.com', name: 'Jane Doe' },
    { key: 'customer3', phone: '6195550789', email: 'mike@example.com', name: 'Mike Johnson' },
    { key: 'garage1', phone: '4155550234', email: 'contact@autofix.com', name: 'AutoFix Garage' },
    { key: 'garage2', phone: '2135550567', email: 'info@quickservice.com', name: 'QuickService Center' },
    { key: 'vendor1', phone: '6025550890', email: 'sales@autoparts.com', name: 'AutoParts Warehouse' },
    { key: 'vendor2', phone: '7135550123', email: 'orders@quickspares.com', name: 'QuickSpares Inc.' },
    { key: 'admin', phone: '5555555555', email: 'admin@wrectifai.com', name: 'Admin User' },
  ];

  for (const user of userData) {
    if (userMap.has(user.phone)) {
      userIds[user.key] = userMap.get(user.phone)!;
    } else {
      const newId = crypto.randomUUID();
      userIds[user.key] = newId;
      await query(
        `INSERT INTO users (id, phone, email, full_name, is_active) VALUES ($1::uuid, $2, $3, $4, TRUE)`,
        [newId, user.phone, user.email, user.name]
      );
    }
  }

  // Insert user roles
  await query(`
    INSERT INTO user_roles (id, user_id, role_id) VALUES
      (gen_random_uuid(), $1::uuid, $2::uuid),
      (gen_random_uuid(), $3::uuid, $4::uuid),
      (gen_random_uuid(), $5::uuid, $6::uuid),
      (gen_random_uuid(), $7::uuid, $8::uuid),
      (gen_random_uuid(), $9::uuid, $10::uuid),
      (gen_random_uuid(), $11::uuid, $12::uuid),
      (gen_random_uuid(), $13::uuid, $14::uuid),
      (gen_random_uuid(), $15::uuid, $16::uuid)
    ON CONFLICT (user_id, role_id) DO NOTHING
  `, [
    userIds.customer1, roleIds.user,
    userIds.customer2, roleIds.user,
    userIds.customer3, roleIds.user,
    userIds.garage1, roleIds.garage,
    userIds.garage2, roleIds.garage,
    userIds.vendor1, roleIds.vendor,
    userIds.vendor2, roleIds.vendor,
    userIds.admin, roleIds.admin,
  ]);

  // Create profiles table if not exists and alter to match schema
  await query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL UNIQUE REFERENCES users(id),
      full_name VARCHAR NOT NULL,
      avatar_url VARCHAR,
      bio TEXT,
      address_line VARCHAR,
      city VARCHAR,
      state VARCHAR,
      postal_code VARCHAR,
      notification_preferences JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Alter profiles table to add missing columns if they don't exist
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line VARCHAR`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state VARCHAR`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code VARCHAR`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);

  // Insert profiles for users
  await query(`
    INSERT INTO profiles (id, user_id, full_name, avatar_url, bio, notification_preferences) VALUES
      (gen_random_uuid(), $1::uuid, 'John Smith', NULL, 'Car enthusiast', '{"bookings":true,"reminders":true,"offers":true}'),
      (gen_random_uuid(), $2::uuid, 'Jane Doe', NULL, 'Daily commuter', '{"bookings":true,"reminders":true,"offers":false}'),
      (gen_random_uuid(), $3::uuid, 'Mike Johnson', NULL, 'Weekend driver', '{"bookings":false,"reminders":true,"offers":true}')
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      bio = EXCLUDED.bio,
      notification_preferences = EXCLUDED.notification_preferences
  `, [
    userIds.customer1, userIds.customer2, userIds.customer3,
  ]);

  // Create garages table if not exists
  await query(`
    CREATE TABLE IF NOT EXISTS garages (
      id UUID PRIMARY KEY,
      owner_user_id UUID NOT NULL UNIQUE REFERENCES users(id),
      business_name VARCHAR NOT NULL,
      address_line VARCHAR NOT NULL,
      city VARCHAR NOT NULL,
      state VARCHAR NOT NULL,
      postal_code VARCHAR NOT NULL,
      specializations TEXT[] NOT NULL,
      business_hours JSONB NOT NULL,
      verification_status VARCHAR DEFAULT 'pending',
      is_approved BOOLEAN DEFAULT FALSE,
      supports_pickup_drop BOOLEAN DEFAULT FALSE,
      trust_score NUMERIC(5,2),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Insert garages
  const garageIds = {
    g1: crypto.randomUUID(),
    g2: crypto.randomUUID(),
    g3: crypto.randomUUID(),
  };

  await query(`
    INSERT INTO garages (id, owner_user_id, business_name, address_line, city, state, postal_code, specializations, business_hours, verification_status, is_approved, trust_score) VALUES
      ($1::uuid, $2::uuid, 'AutoFix Garage', '123 Main St', 'San Francisco', 'CA', '94102', ARRAY['brakes', 'engine', 'oil'], '{"monday":{"open":"08:00","close":"18:00"},"tuesday":{"open":"08:00","close":"18:00"}}', 'approved', TRUE, 4.5),
      ($3::uuid, $4::uuid, 'QuickService Center', '456 Oak Ave', 'Los Angeles', 'CA', '90001', ARRAY['oil', 'inspection', 'tires'], '{"monday":{"open":"07:00","close":"19:00"},"tuesday":{"open":"07:00","close":"19:00"}}', 'approved', TRUE, 4.2),
      ($5::uuid, $6::uuid, 'Premium Motors', '789 Pine Rd', 'San Diego', 'CA', '92101', ARRAY['engine', 'transmission', 'electrical'], '{"monday":{"open":"09:00","close":"17:00"},"tuesday":{"open":"09:00","close":"17:00"}}', 'approved', TRUE, 4.8)
    ON CONFLICT DO NOTHING
  `, [
    garageIds.g1, userIds.garage1,
    garageIds.g2, userIds.garage2,
    garageIds.g3, userIds.garage2,
  ]);

  // Insert vehicles for customers
  let vehicleIds: Record<string, string> = {};

  const existingVehicles = await query<{ id: string; user_id: string; make: string; model: string }>('SELECT id, user_id, make, model FROM vehicles');
  const vehicleMap = new Map(existingVehicles.rows.map(v => [`${v.user_id}-${v.make}-${v.model}`, v.id]));

  const vehicleData = [
    { key: 'v1', userId: 'customer1', make: 'Toyota', model: 'Camry', year: 2022, fuel: 'Gasoline', mileage: 15000 },
    { key: 'v2', userId: 'customer2', make: 'Honda', model: 'Civic', year: 2021, fuel: 'Gasoline', mileage: 25000 },
    { key: 'v3', userId: 'customer3', make: 'Ford', model: 'F-150', year: 2023, fuel: 'Gasoline', mileage: 5000 },
  ];

  for (const vehicle of vehicleData) {
    const userId = userIds[vehicle.userId];
    const mapKey = `${userId}-${vehicle.make}-${vehicle.model}`;
    if (vehicleMap.has(mapKey)) {
      vehicleIds[vehicle.key] = vehicleMap.get(mapKey)!;
    } else {
      const newId = crypto.randomUUID();
      vehicleIds[vehicle.key] = newId;
      await query(
        `INSERT INTO vehicles (id, user_id, make, model, year, fuel_type, mileage, is_default) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, TRUE)`,
        [newId, userId, vehicle.make, vehicle.model, vehicle.year, vehicle.fuel, vehicle.mileage]
      );
    }
  }

  // Insert issue requests
  const issueRequestIds = {
    ir1: crypto.randomUUID(),
    ir2: crypto.randomUUID(),
    ir3: crypto.randomUUID(),
  };

  await query(`
    INSERT INTO issue_requests (id, customer_user_id, vehicle_id, summary, status) VALUES
      ($1::uuid, $2::uuid, $3::uuid, 'Brake repair needed', 'open'),
      ($4::uuid, $5::uuid, $6::uuid, 'Oil change and inspection', 'open'),
      ($7::uuid, $8::uuid, $9::uuid, 'Engine diagnostic', 'open')
    ON CONFLICT DO NOTHING
  `, [
    issueRequestIds.ir1, userIds.customer1, vehicleIds.v1,
    issueRequestIds.ir2, userIds.customer2, vehicleIds.v2,
    issueRequestIds.ir3, userIds.customer3, vehicleIds.v3,
  ]);

  // Alter quotes table to match schema
  await query(`ALTER TABLE quotes DROP COLUMN IF EXISTS garage_name`);
  await query(`ALTER TABLE quotes DROP COLUMN IF EXISTS garage_rating`);
  await query(`ALTER TABLE quotes DROP COLUMN IF EXISTS distance_miles`);
  await query(`ALTER TABLE quotes DROP COLUMN IF EXISTS description`);
  await query(`ALTER TABLE quotes DROP COLUMN IF EXISTS estimated_days`);
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS garage_id UUID`);
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS currency CHAR(3) DEFAULT 'USD'`);
  await query(`ALTER TABLE quotes ADD COLUMN IF NOT EXISTS eta_note VARCHAR`);
  try {
    await query(`ALTER TABLE quotes ADD CONSTRAINT quotes_garage_id_fkey FOREIGN KEY (garage_id) REFERENCES garages(id)`);
  } catch {
    // Constraint may already exist
  }

  // Insert quotes
  const quoteIds = {
    q1: crypto.randomUUID(),
    q2: crypto.randomUUID(),
    q3: crypto.randomUUID(),
  };

  await query(`
    INSERT INTO quotes (id, issue_request_id, garage_id, parts_cost, labor_cost, total_cost, currency, eta_note, comparison_label, status) VALUES
      ($1::uuid, $2::uuid, $3::uuid, 150.00, 100.00, 250.00, 'USD', '2-3 days', 'fair', 'submitted'),
      ($4::uuid, $5::uuid, $6::uuid, 45.00, 30.00, 75.00, 'USD', '1 day', 'fair', 'submitted'),
      ($7::uuid, $8::uuid, $9::uuid, 100.00, 80.00, 180.00, 'USD', '3-4 days', 'above_market', 'submitted')
    ON CONFLICT DO NOTHING
  `, [
    quoteIds.q1, issueRequestIds.ir1, garageIds.g1,
    quoteIds.q2, issueRequestIds.ir2, garageIds.g2,
    quoteIds.q3, issueRequestIds.ir3, garageIds.g3,
  ]);

  // Alter bookings table to match schema
  await query(`ALTER TABLE bookings DROP COLUMN IF EXISTS garage_name`);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS garage_id UUID`);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checkin_mode VARCHAR DEFAULT 'self_checkin'`);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_note TEXT`);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
  try {
    await query(`ALTER TABLE bookings ADD CONSTRAINT bookings_garage_id_fkey FOREIGN KEY (garage_id) REFERENCES garages(id)`);
  } catch {
    // Constraint may already exist
  }

  // Insert bookings
  const bookingIds = {
    b1: crypto.randomUUID(),
    b2: crypto.randomUUID(),
  };

  await query(`
    INSERT INTO bookings (id, quote_id, customer_user_id, garage_id, appointment_time, checkin_mode, status) VALUES
      ($1::uuid, $2::uuid, $3::uuid, $4::uuid, NOW() + INTERVAL '2 days', 'self_checkin', 'confirmed'),
      ($5::uuid, $6::uuid, $7::uuid, $8::uuid, NOW() + INTERVAL '5 days', 'self_checkin', 'booked')
    ON CONFLICT DO NOTHING
  `, [
    bookingIds.b1, quoteIds.q1, userIds.customer1, garageIds.g1,
    bookingIds.b2, quoteIds.q2, userIds.customer2, garageIds.g2,
  ]);

  // Alter payments table to match schema
  await query(`ALTER TABLE payments DROP COLUMN IF EXISTS customer_user_id`);
  await query(`ALTER TABLE payments DROP COLUMN IF EXISTS method`);
  await query(`ALTER TABLE payments DROP COLUMN IF EXISTS receipt_number`);
  await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider VARCHAR`);
  await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR`);
  await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency CHAR(3) DEFAULT 'USD'`);
  await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url VARCHAR`);
  await query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);

  // Insert payments
  await query(`
    INSERT INTO payments (id, booking_id, provider, provider_payment_id, amount, currency, status) VALUES
      (gen_random_uuid(), $1::uuid, 'stripe', 'pi_1234567890', 250.00, 'USD', 'succeeded'),
      (gen_random_uuid(), $2::uuid, 'apple_pay', 'ap_0987654321', 75.00, 'USD', 'succeeded')
    ON CONFLICT DO NOTHING
  `, [
    bookingIds.b1,
    bookingIds.b2,
  ]);

  // Insert support tickets (complaints)
  await query(`
    INSERT INTO support_tickets (id, customer_user_id, subject, description, status) VALUES
      (gen_random_uuid(), $1::uuid, 'Overcharging', 'Quoted $250 but charged $350 without explanation', 'resolved'),
      (gen_random_uuid(), $2::uuid, 'Poor Service', 'Service took longer than promised and quality was poor', 'in_progress'),
      (gen_random_uuid(), $3::uuid, 'Behavior', 'Rude behavior from staff during service visit', 'open')
    ON CONFLICT DO NOTHING
  `, [
    userIds.customer1, userIds.customer2, userIds.customer3,
  ]);

  console.log('Database seeded successfully!');
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

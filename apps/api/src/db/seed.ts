import crypto from 'node:crypto';
import { query } from './postgres';

export async function seedDatabase() {
  console.log('Seeding database with sample data...');

  // Seed sample users with different roles
  const userIds = {
    customer1: crypto.randomUUID(),
    customer2: crypto.randomUUID(),
    customer3: crypto.randomUUID(),
    garage1: crypto.randomUUID(),
    garage2: crypto.randomUUID(),
    vendor1: crypto.randomUUID(),
    vendor2: crypto.randomUUID(),
    admin: crypto.randomUUID(),
  };

  const roleIds = {
    user: '11111111-1111-1111-1111-111111111111',
    garage: '22222222-2222-2222-2222-222222222222',
    vendor: '33333333-3333-3333-3333-333333333333',
    admin: '44444444-4444-4444-4444-444444444444',
  };

  // Insert users
  await query(`
    INSERT INTO users (id, phone, email, full_name, is_active) VALUES
      ($1::uuid, '4155550123', 'john@example.com', 'John Smith', TRUE),
      ($2::uuid, '2135550456', 'jane@example.com', 'Jane Doe', TRUE),
      ($3::uuid, '6195550789', 'mike@example.com', 'Mike Johnson', TRUE),
      ($4::uuid, '4155550234', 'contact@autofix.com', 'AutoFix Garage', TRUE),
      ($5::uuid, '2135550567', 'info@quickservice.com', 'QuickService Center', TRUE),
      ($6::uuid, '6025550890', 'sales@autoparts.com', 'AutoParts Warehouse', TRUE),
      ($7::uuid, '7135550123', 'orders@quickspares.com', 'QuickSpares Inc.', TRUE),
      ($8::uuid, '5555555555', 'admin@wrectifai.com', 'Admin User', TRUE)
    ON CONFLICT (phone) DO NOTHING
  `, [
    userIds.customer1, userIds.customer2, userIds.customer3,
    userIds.garage1, userIds.garage2, userIds.vendor1, userIds.vendor2, userIds.admin
  ]);

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

  // Insert vehicles for customers
  const vehicleIds = {
    v1: crypto.randomUUID(),
    v2: crypto.randomUUID(),
    v3: crypto.randomUUID(),
  };

  await query(`
    INSERT INTO vehicles (id, user_id, make, model, year, fuel_type, mileage, is_default) VALUES
      ($1::uuid, $2::uuid, 'Toyota', 'Camry', 2022, 'Gasoline', 15000, TRUE),
      ($3::uuid, $4::uuid, 'Honda', 'Civic', 2021, 'Gasoline', 25000, TRUE),
      ($5::uuid, $6::uuid, 'Ford', 'F-150', 2023, 'Gasoline', 5000, TRUE)
    ON CONFLICT DO NOTHING
  `, [
    vehicleIds.v1, userIds.customer1,
    vehicleIds.v2, userIds.customer2,
    vehicleIds.v3, userIds.customer3,
  ]);

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

  // Insert quotes
  const quoteIds = {
    q1: crypto.randomUUID(),
    q2: crypto.randomUUID(),
    q3: crypto.randomUUID(),
  };

  await query(`
    INSERT INTO quotes (id, issue_request_id, garage_name, garage_rating, distance_miles, parts_cost, labor_cost, total_cost, comparison_label, status) VALUES
      ($1::uuid, $2::uuid, 'AutoFix Garage', 4.5, 5.2, 150.00, 100.00, 250.00, 'fair', 'accepted'),
      ($3::uuid, $4::uuid, 'QuickService Center', 4.2, 3.8, 45.00, 30.00, 75.00, 'fair', 'pending'),
      ($5::uuid, $6::uuid, 'Premium Motors', 4.8, 8.5, 100.00, 80.00, 180.00, 'above', 'rejected')
    ON CONFLICT DO NOTHING
  `, [
    quoteIds.q1, issueRequestIds.ir1,
    quoteIds.q2, issueRequestIds.ir2,
    quoteIds.q3, issueRequestIds.ir3,
  ]);

  // Insert bookings
  const bookingIds = {
    b1: crypto.randomUUID(),
    b2: crypto.randomUUID(),
  };

  await query(`
    INSERT INTO bookings (id, quote_id, customer_user_id, garage_name, appointment_time, status) VALUES
      ($1::uuid, $2::uuid, $3::uuid, 'AutoFix Garage', NOW() + INTERVAL '2 days', 'confirmed'),
      ($4::uuid, $5::uuid, $6::uuid, 'QuickService Center', NOW() + INTERVAL '5 days', 'booked')
    ON CONFLICT DO NOTHING
  `, [
    bookingIds.b1, quoteIds.q1, userIds.customer1,
    bookingIds.b2, quoteIds.q2, userIds.customer2,
  ]);

  // Insert payments
  await query(`
    INSERT INTO payments (id, booking_id, customer_user_id, amount, method, status, receipt_number) VALUES
      (gen_random_uuid(), $1::uuid, $2::uuid, 250.00, 'card', 'paid', 'RCT-001'),
      (gen_random_uuid(), $3::uuid, $4::uuid, 75.00, 'apple_pay', 'paid', 'RCT-002')
    ON CONFLICT DO NOTHING
  `, [
    bookingIds.b1, userIds.customer1,
    bookingIds.b2, userIds.customer2,
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

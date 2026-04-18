import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth, requireRole } from '../auth/auth.middleware';
import { query } from '../../db/postgres';

const router = Router();

async function resolveOrCreateGarageForUser(userId: string): Promise<string> {
  const existingGarage = await query(
    `SELECT id FROM garages WHERE owner_user_id = $1::uuid LIMIT 1`,
    [userId]
  );

  if (existingGarage.rows.length > 0) {
    return existingGarage.rows[0].id;
  }

  const userResult = await query(
    `SELECT full_name FROM users WHERE id = $1::uuid LIMIT 1`,
    [userId]
  );
  const businessName = userResult.rows[0]?.full_name?.trim() || 'My Garage';

  const garageColumnTypes = await query<{
    column_name: string;
    data_type: string;
    udt_name: string;
  }>(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'garages'
        AND column_name IN ('specializations', 'business_hours')
    `
  );

  const specializationsColumn = garageColumnTypes.rows.find((column) => column.column_name === 'specializations');
  const businessHoursColumn = garageColumnTypes.rows.find((column) => column.column_name === 'business_hours');

  const specializationsValueSql = specializationsColumn?.udt_name === '_text'
    ? 'ARRAY[]::text[]'
    : '\'[]\'::jsonb';
  const businessHoursValueSql = businessHoursColumn?.data_type === 'jsonb'
    ? '\'{}\'::jsonb'
    : '\'{}\'';

  const createdGarage = await query(
    `
      INSERT INTO garages (
        id,
        owner_user_id,
        business_name,
        address_line,
        city,
        state,
        postal_code,
        specializations,
        business_hours,
        verification_status,
        is_approved,
        trust_score
      )
      VALUES (
        $7::uuid,
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        ${specializationsValueSql},
        ${businessHoursValueSql},
        'pending',
        false,
        0
      )
      RETURNING id
    `,
    [userId, businessName, 'N/A', 'N/A', 'N/A', 'N/A', crypto.randomUUID()]
  );

  return createdGarage.rows[0].id;
}

// Get garage dashboard data
router.get('/dashboard', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;

    const garageId = await resolveOrCreateGarageForUser(userId);
    const garageResult = await query(`SELECT trust_score, is_approved FROM garages WHERE id = $1::uuid LIMIT 1`, [garageId]);
    const trustScore = garageResult.rows[0]?.trust_score || 0;
    const isApproved = garageResult.rows[0]?.is_approved === true;

    // Check if garage_id column exists in bookings table
    let hasGarageIdColumn = false;
    try {
      const garageIdColumnCheck = await query<{ exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'bookings'
              AND column_name = 'garage_id'
          ) AS exists
        `
      );
      hasGarageIdColumn = garageIdColumnCheck.rows[0]?.exists === true;
    } catch {
      hasGarageIdColumn = false;
    }

    // Count total bookings
    let totalBookings = 0;
    try {
      let bookingsQuery;
      if (hasGarageIdColumn) {
        bookingsQuery = await query(
          `SELECT COUNT(*) as count FROM bookings WHERE garage_id = $1::uuid`,
          [garageId]
        );
      } else {
        bookingsQuery = await query(
          `SELECT COUNT(*) as count FROM bookings b
           JOIN quotes q ON q.id = b.quote_id
           WHERE q.garage_id = $1::uuid`,
          [garageId]
        );
      }
      totalBookings = parseInt(bookingsQuery.rows[0]?.count || '0', 10);
    } catch {
      totalBookings = 0;
    }

    // Count quotes sent
    let quotesSent = 0;
    try {
      const quotesQuery = await query(
        `SELECT COUNT(*) as count FROM quotes WHERE garage_id = $1::uuid`,
        [garageId]
      );
      quotesSent = parseInt(quotesQuery.rows[0]?.count || '0', 10);
    } catch {
      quotesSent = 0;
    }

    // Calculate revenue from payments
    let revenue = 0;
    try {
      let paymentsQuery;
      if (hasGarageIdColumn) {
        paymentsQuery = await query(
          `SELECT COALESCE(SUM(p.amount), 0) as total
           FROM payments p
           JOIN bookings b ON b.id = p.booking_id
           WHERE b.garage_id = $1::uuid AND p.status = 'paid'`,
          [garageId]
        );
      } else {
        paymentsQuery = await query(
          `SELECT COALESCE(SUM(p.amount), 0) as total
           FROM payments p
           JOIN bookings b ON b.id = p.booking_id
           JOIN quotes q ON q.id = b.quote_id
           WHERE q.garage_id = $1::uuid AND p.status = 'paid'`,
          [garageId]
        );
      }
      revenue = parseFloat(paymentsQuery.rows[0]?.total || '0');
    } catch {
      revenue = 0;
    }

    // Get rating and review count (using trust_score as rating for now)
    const rating = trustScore;
    const reviewCount = 0;

    // Get recent activity
    const recentActivity: Array<{
      id: string;
      type: string;
      message: string;
      details: string;
      time: string;
    }> = [];

    const dashboardData = {
      totalBookings,
      quotesSent,
      revenue,
      rating,
      reviewCount,
      recentActivity,
      isApproved,
    };

    return res.json(dashboardData);
  } catch (error) {
    console.error('Garage dashboard error:', error);
    return next(error);
  }
});

// Get garage orders (new issue requests from users)
router.get('/orders', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    // Fetch all issue requests from users
    const result = await query(`
      SELECT 
        ir.id,
        ir.summary as issue,
        ir.issue_payload,
        ir.status,
        ir.created_at as submitted,
        u.full_name as customer,
        u.phone as customer_phone,
        v.make,
        v.model,
        v.year,
        CONCAT(v.make, ' ', v.model, ' ', v.year) as vehicle
      FROM issue_requests ir
      JOIN users u ON ir.customer_user_id = u.id
      JOIN vehicles v ON ir.vehicle_id = v.id
      WHERE ir.status IN ('open', 'quotes_pending')
      ORDER BY ir.created_at DESC
    `);

    const orders = result.rows.map((row) => {
      const payload =
        row.issue_payload && typeof row.issue_payload === 'object'
          ? (row.issue_payload as Record<string, unknown>)
          : {};
      const urgencyRaw = String(payload.urgency ?? '').trim().toLowerCase();
      const urgency =
        urgencyRaw === 'high' || urgencyRaw === 'critical'
          ? 'High'
          : urgencyRaw === 'low'
            ? 'Low'
            : 'Medium';

      return {
        id: row.id,
        customer: row.customer,
        customer_phone: row.customer_phone,
        vehicle: row.vehicle,
        issue: row.issue,
        urgency,
        status: row.status === 'quotes_pending' ? 'Quoted' : 'New',
        submitted: row.submitted,
      };
    });

    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

// Submit a quote for an issue request
router.post('/orders/:issueRequestId/quotes', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const { issueRequestId } = req.params;
    const { parts_cost, labor_cost, eta_note, comparison_label, garage_id } = req.body;
    const userId = req.authUser!.userId;

    // Validate inputs
    if (!parts_cost || !labor_cost) {
      return res.status(400).json({ message: 'parts_cost and labor_cost are required' });
    }

    // Use provided garage_id or resolve/create from user ID
    let finalGarageId = garage_id;
    if (!finalGarageId) {
      finalGarageId = await resolveOrCreateGarageForUser(userId);
    }

    // Calculate total cost
    const total_cost = parseFloat(parts_cost) + parseFloat(labor_cost);

    // Insert quote with columns that exist in the database schema
    const quoteResult = await query(`
      INSERT INTO quotes (id, issue_request_id, garage_id, parts_cost, labor_cost, total_cost, comparison_label, status, eta_note)
      VALUES ($9::uuid, $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      issueRequestId,
      finalGarageId,
      parseFloat(parts_cost),
      parseFloat(labor_cost),
      total_cost,
      comparison_label || 'fair',
      'pending',
      eta_note,
      crypto.randomUUID(),
    ]);

    // Update issue request status to quotes_pending if it was open
    await query(`
      UPDATE issue_requests 
      SET status = 'quotes_pending' 
      WHERE id = $1::uuid AND status = 'open'
    `, [issueRequestId]);

    return res.json({
      message: 'Quote submitted successfully',
      quote_id: quoteResult.rows[0].id
    });
  } catch (error) {
    console.error('Quote submission error:', error);
    return next(error);
  }
});

// Get full issue details for an issue request
router.get('/orders/:issueRequestId/issue-details', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const { issueRequestId } = req.params;

    // Fetch issue request with full details
    const issueResult = await query(`
      SELECT
        ir.id,
        ir.summary,
        ir.status,
        ir.created_at,
        ir.issue_payload,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        v.make,
        v.model,
        v.year,
        v.fuel_type,
        v.mileage,
        CONCAT(v.make, ' ', v.model, ' ', v.year) as vehicle
      FROM issue_requests ir
      JOIN users u ON ir.customer_user_id = u.id
      JOIN vehicles v ON ir.vehicle_id = v.id
      WHERE ir.id = $1::uuid
    `, [issueRequestId]);

    if (issueResult.rows.length === 0) {
      return res.status(404).json({ message: 'Issue request not found' });
    }

    const issue = issueResult.rows[0];

    // Fetch all quotes for this issue (from all garages)
    const quoteResult = await query(`
      SELECT id, issue_request_id, garage_id, parts_cost, labor_cost, total_cost,
             eta_note, comparison_label, status, created_at
      FROM quotes
      WHERE issue_request_id = $1::uuid
      ORDER BY created_at DESC
    `, [issueRequestId]);

    return res.json({
      issue: issue,
      quotes: quoteResult.rows,
    });
  } catch (error) {
    console.error('Issue details fetch error:', error);
    return next(error);
  }
});

// Get quote details for an issue request
router.get('/orders/:issueRequestId/quote-details', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const { issueRequestId } = req.params;

    // Fetch all quotes for this issue request (from all garages)
    const quoteResult = await query(`
      SELECT id, issue_request_id, garage_id, parts_cost, labor_cost, total_cost,
             eta_note, comparison_label, status, created_at
      FROM quotes
      WHERE issue_request_id = $1::uuid
      ORDER BY created_at DESC
    `, [issueRequestId]);

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ message: 'No quote found for this issue request' });
    }

    return res.json(quoteResult.rows);
  } catch (error) {
    console.error('Quote details fetch error:', error);
    return next(error);
  }
});

// Get garage bookings
router.get('/bookings', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;

    const garageId = await resolveOrCreateGarageForUser(userId);

    // Check if garage_id column exists in bookings table
    let hasGarageIdColumn = false;
    try {
      const garageIdColumnCheck = await query<{ exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'bookings'
              AND column_name = 'garage_id'
          ) AS exists
        `
      );
      hasGarageIdColumn = garageIdColumnCheck.rows[0]?.exists === true;
      console.log('[Garage Bookings] garage_id column exists:', hasGarageIdColumn);
    } catch (checkError) {
      console.error('[Garage Bookings] Error checking garage_id column:', checkError);
      hasGarageIdColumn = false;
    }

    // Check if checkin_mode column exists
    let hasCheckinModeColumn = false;
    try {
      const checkinModeColumnCheck = await query<{ exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'bookings'
              AND column_name = 'checkin_mode'
          ) AS exists
        `
      );
      hasCheckinModeColumn = checkinModeColumnCheck.rows[0]?.exists === true;
      console.log('[Garage Bookings] checkin_mode column exists:', hasCheckinModeColumn);
    } catch (checkError) {
      console.error('[Garage Bookings] Error checking checkin_mode column:', checkError);
      hasCheckinModeColumn = false;
    }

    let result;
    if (hasGarageIdColumn) {
      const checkinModeSelect = hasCheckinModeColumn ? 'b.checkin_mode' : "'self_checkin' as checkin_mode";
      result = await query(
        `
          SELECT
            b.id,
            b.appointment_time,
            ${checkinModeSelect},
            b.status,
            u.full_name AS customer_name,
            ir.summary AS service,
            v.make,
            v.model,
            v.year
          FROM bookings b
          JOIN quotes q ON q.id = b.quote_id
          JOIN issue_requests ir ON ir.id = q.issue_request_id
          JOIN users u ON u.id = b.customer_user_id
          JOIN vehicles v ON v.id = ir.vehicle_id
          WHERE b.garage_id = $1::uuid
          ORDER BY b.created_at DESC
        `,
        [garageId]
      );
    } else {
      // Fallback: get bookings by joining through quotes
      const checkinModeSelect = hasCheckinModeColumn ? 'b.checkin_mode' : "'self_checkin' as checkin_mode";
      result = await query(
        `
          SELECT
            b.id,
            b.appointment_time,
            ${checkinModeSelect},
            b.status,
            u.full_name AS customer_name,
            ir.summary AS service,
            v.make,
            v.model,
            v.year
          FROM bookings b
          JOIN quotes q ON q.id = b.quote_id
          JOIN issue_requests ir ON ir.id = q.issue_request_id
          JOIN users u ON u.id = b.customer_user_id
          JOIN vehicles v ON v.id = ir.vehicle_id
          WHERE q.garage_id = $1::uuid
          ORDER BY b.created_at DESC
        `,
        [garageId]
      );
    }

    console.log('[Garage Bookings] Query result rows:', result.rows.length);

    const formatBookingStatus = (status: string): string => {
      const normalized = String(status ?? '').trim().toLowerCase();
      if (normalized === 'booked') return 'Confirmed';
      if (normalized === 'in_service') return 'Pending';
      if (normalized === 'completed') return 'Completed';
      if (normalized === 'cancelled') return 'Cancelled';
      return normalized
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Pending';
    };

    const bookings = result.rows.map((row) => {
      const appointmentDate = row.appointment_time ? new Date(row.appointment_time) : null;
      const date = appointmentDate
        ? appointmentDate.toLocaleDateString('en-US')
        : '';
      const time = appointmentDate
        ? appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : '';

      return {
        id: row.id,
        customer: row.customer_name,
        vehicle: `${row.make} ${row.model} ${row.year}`,
        service: row.service,
        date,
        time,
        status: formatBookingStatus(row.status),
        mode: row.checkin_mode === 'home_pickup' ? 'Home Pickup' : 'Self Check-in',
      };
    });

    return res.json({ bookings });
  } catch (error) {
    return next(error);
  }
});

// Update garage booking status
router.patch('/bookings/:bookingId', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { bookingId } = req.params;
    const normalizedStatus = String(req.body?.status ?? '').trim().toLowerCase();

    const allowedStatuses = new Set(['booked', 'in_service', 'completed', 'cancelled']);
    if (!allowedStatuses.has(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const garageId = await resolveOrCreateGarageForUser(userId);

    let hasGarageIdColumn = false;
    try {
      const garageIdColumnCheck = await query<{ exists: boolean }>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'bookings'
              AND column_name = 'garage_id'
          ) AS exists
        `
      );
      hasGarageIdColumn = garageIdColumnCheck.rows[0]?.exists === true;
    } catch {
      hasGarageIdColumn = false;
    }

    const result = hasGarageIdColumn
      ? await query(
          `
            UPDATE bookings b
            SET status = $1
            WHERE b.id = $2::uuid
              AND b.garage_id = $3::uuid
            RETURNING b.id, b.status
          `,
          [normalizedStatus, bookingId, garageId]
        )
      : await query(
          `
            UPDATE bookings b
            SET status = $1
            FROM quotes q
            WHERE b.id = $2::uuid
              AND b.quote_id = q.id
              AND q.garage_id = $3::uuid
            RETURNING b.id, b.status
          `,
          [normalizedStatus, bookingId, garageId]
        );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const formatBookingStatus = (status: string): string => {
      const normalized = String(status ?? '').trim().toLowerCase();
      if (normalized === 'booked') return 'Confirmed';
      if (normalized === 'in_service') return 'Pending';
      if (normalized === 'completed') return 'Completed';
      if (normalized === 'cancelled') return 'Cancelled';
      return 'Pending';
    };

    return res.json({
      booking: {
        id: result.rows[0].id,
        status: formatBookingStatus(result.rows[0].status),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Get garage services
router.get('/services', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const garageId = req.authUser!.userId;

    const result = await query(`
      SELECT id, name, category, price, description, active
      FROM garage_services
      WHERE garage_user_id = $1::uuid
      ORDER BY created_at DESC
    `, [garageId]);

    const services = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: parseFloat(row.price),
      description: row.description,
      active: row.active,
    }));

    return res.json({ services });
  } catch (error) {
    return next(error);
  }
});

// Create garage service
router.post('/services', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const garageId = req.authUser!.userId;
    const { name, category, price, description } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    const result = await query(`
      INSERT INTO garage_services (id, garage_user_id, name, category, price, description, active)
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, true)
      RETURNING id, name, category, price, description, active
    `, [crypto.randomUUID(), garageId, name, category, price, description || null]);

    const service = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      category: result.rows[0].category,
      price: parseFloat(result.rows[0].price),
      description: result.rows[0].description,
      active: result.rows[0].active,
    };

    return res.status(201).json({ service });
  } catch (error) {
    return next(error);
  }
});

// Update garage service
router.put('/services/:serviceId', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const garageId = req.authUser!.userId;
    const { serviceId } = req.params;
    const { name, category, price, description, active } = req.body;

    const result = await query(`
      UPDATE garage_services
      SET name = COALESCE($1, name),
          category = COALESCE($2, category),
          price = COALESCE($3, price),
          description = COALESCE($4, description),
          active = COALESCE($5, active),
          updated_at = NOW()
      WHERE id = $6::uuid AND garage_user_id = $7::uuid
      RETURNING id, name, category, price, description, active
    `, [name, category, price, description, active, serviceId, garageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const service = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      category: result.rows[0].category,
      price: parseFloat(result.rows[0].price),
      description: result.rows[0].description,
      active: result.rows[0].active,
    };

    return res.json({ service });
  } catch (error) {
    return next(error);
  }
});

// Delete garage service
router.delete('/services/:serviceId', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const garageId = req.authUser!.userId;
    const { serviceId } = req.params;

    const result = await query(`
      DELETE FROM garage_services
      WHERE id = $1::uuid AND garage_user_id = $2::uuid
      RETURNING id
    `, [serviceId, garageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

// Get garage availability
router.get('/availability', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const garageUserId = req.authUser!.userId;
    const profileResult = await query<{ business_hours: string | null }>(
      `
        SELECT business_hours
        FROM profiles
        WHERE user_id = $1::uuid
        LIMIT 1
      `,
      [garageUserId]
    );

    const businessHoursRaw = profileResult.rows[0]?.business_hours;
    if (businessHoursRaw && businessHoursRaw.trim()) {
      try {
        const parsed = JSON.parse(businessHoursRaw);
        if (parsed && typeof parsed === 'object') {
          return res.json(parsed);
        }
      } catch {
        // Fall through to default availability payload.
      }
    }

    const availability = {
      businessHours: [
        {
          id: '1',
          day: 'Monday',
          startTime: '09:00',
          endTime: '18:00',
          active: true,
        },
        {
          id: '2',
          day: 'Tuesday',
          startTime: '09:00',
          endTime: '18:00',
          active: true,
        },
        {
          id: '3',
          day: 'Wednesday',
          startTime: '09:00',
          endTime: '18:00',
          active: true,
        },
        {
          id: '4',
          day: 'Thursday',
          startTime: '09:00',
          endTime: '18:00',
          active: true,
        },
        {
          id: '5',
          day: 'Friday',
          startTime: '09:00',
          endTime: '18:00',
          active: true,
        },
        {
          id: '6',
          day: 'Saturday',
          startTime: '10:00',
          endTime: '16:00',
          active: true,
        },
        {
          id: '7',
          day: 'Sunday',
          startTime: '10:00',
          endTime: '14:00',
          active: false,
        },
      ],
      blockedDates: [
        {
          id: '1',
          date: '2024-12-25',
          reason: 'Christmas Holiday',
        },
        {
          id: '2',
          date: '2025-01-01',
          reason: "New Year's Day",
        },
      ],
      pickupDropoff: {
        homePickup: true,
        dropoff: true,
      },
    };
    return res.json(availability);
  } catch (error) {
    return next(error);
  }
});

// Get garage profile
router.get('/profile', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const garageId = req.authUser!.userId;

    const result = await query(`
      SELECT
        u.full_name as garage_name,
        u.email,
        u.phone,
        p.address_line,
        p.city,
        p.state,
        p.postal_code,
        p.bio as description,
        p.business_hours,
        p.specializations,
        p.certifications,
        g.is_approved
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN garages g ON g.owner_user_id = u.id
      WHERE u.id = $1::uuid
    `, [garageId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const row = result.rows[0];
    const profile = {
      garageName: row.garage_name || '',
      email: row.email || '',
      phone: row.phone || '',
      address: [row.address_line, row.city, row.state, row.postal_code].filter(Boolean).join(', ') || '',
      businessHours: row.business_hours || '',
      description: row.description || '',
      specializations: row.specializations && typeof row.specializations === 'string' && row.specializations.trim() ? JSON.parse(row.specializations) : [],
      certifications: row.certifications && typeof row.certifications === 'string' && row.certifications.trim() ? JSON.parse(row.certifications) : [],
      isApproved: row.is_approved === true,
    };

    return res.json(profile);
  } catch (error) {
    return next(error);
  }
});

// Update garage profile
router.put('/profile', requireAuth, requireRole('garage'), async (req, res, next) => {
  try {
    const garageId = req.authUser!.userId;
    const { garageName, email, phone, address, businessHours, description, specializations, certifications } = req.body;

    // Update users table
    await query(`
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          updated_at = NOW()
      WHERE id = $4::uuid
    `, [garageName, email, phone, garageId]);

    // Parse address into components
    const addressParts = address ? address.split(',').map((p: string) => p.trim()) : [];
    const address_line = addressParts[0] || null;
    const city = addressParts[1] || null;
    const state = addressParts[2] || null;
    const postal_code = addressParts[3] || null;

    // Upsert profile
    await query(`
      INSERT INTO profiles (id, user_id, bio, address_line, city, state, postal_code, business_hours, specializations, certifications)
      VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id)
      DO UPDATE SET
        bio = COALESCE(EXCLUDED.bio, profiles.bio),
        address_line = COALESCE(EXCLUDED.address_line, profiles.address_line),
        city = COALESCE(EXCLUDED.city, profiles.city),
        state = COALESCE(EXCLUDED.state, profiles.state),
        postal_code = COALESCE(EXCLUDED.postal_code, profiles.postal_code),
        business_hours = COALESCE(EXCLUDED.business_hours, profiles.business_hours),
        specializations = COALESCE(EXCLUDED.specializations, profiles.specializations),
        certifications = COALESCE(EXCLUDED.certifications, profiles.certifications),
        updated_at = NOW()
    `, [crypto.randomUUID(), garageId, description, address_line, city, state, postal_code, businessHours, JSON.stringify(specializations || []), JSON.stringify(certifications || [])]);

    return res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    return next(error);
  }
});

export default router;

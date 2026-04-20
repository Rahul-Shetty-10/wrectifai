import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../../db/postgres';
import { requireAuth, requireRole } from '../auth/auth.middleware';

export const marketplaceRouter = Router();

marketplaceRouter.use(requireAuth, requireRole('user'));

type IntakePayload = {
  source?: 'diagnosis' | 'direct';
  diagnosisSessionId?: string;
  vehicle?: {
    id?: string;
    type?: string;
    brand?: string;
    model?: string;
    year?: number;
    fuel?: string;
    variant?: string;
  };
  issue?: {
    category?: string;
    symptoms?: string[];
    severity?: string;
    description?: string;
    sinceWhen?: string;
    whenHappens?: string;
  };
  media?: Array<{
    type?: 'image' | 'video' | 'audio';
    name?: string;
  }>;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  serviceType?: 'pickup' | 'visit';
  schedule?: {
    mode?: 'now' | 'scheduled';
    preferredAt?: string;
  };
  user?: {
    name?: string;
    phone?: string;
    alternatePhone?: string;
  };
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanPhone(value: unknown) {
  return cleanText(value).replace(/\D/g, '');
}

function summarizeIssue(payload: IntakePayload) {
  const category = cleanText(payload.issue?.category);
  const description = cleanText(payload.issue?.description);
  const severity = cleanText(payload.issue?.severity);
  if (description) return description;
  if (category && severity) return `${category} issue (${severity})`;
  if (category) return `${category} issue`;
  return 'Service request';
}

async function resolveVehicleId(userId: string, payload: IntakePayload) {
  const vehicleId = cleanText(payload.vehicle?.id);
  if (vehicleId) {
    const existing = await query<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, userId]
    );
    if (!existing.rows[0]) {
      throw new Error('Selected vehicle was not found');
    }
    return vehicleId;
  }

  const brand = cleanText(payload.vehicle?.brand);
  const model = cleanText(payload.vehicle?.model);
  const fuel = cleanText(payload.vehicle?.fuel);
  const year = Number(payload.vehicle?.year ?? 0);
  if (!brand || !model || !fuel || !year) {
    throw new Error('Vehicle details are required');
  }

  const newVehicleId = crypto.randomUUID();
  await query(
    `
      INSERT INTO vehicles (id, user_id, make, model, year, fuel_type, trim, is_default)
      VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE)
    `,
    [newVehicleId, userId, brand, model, year, fuel, cleanText(payload.vehicle?.variant) || null]
  );
  return newVehicleId;
}

marketplaceRouter.post('/intake', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const body = (req.body ?? {}) as IntakePayload;

    const category = cleanText(body.issue?.category);
    const severity = cleanText(body.issue?.severity);
    const userName = cleanText(body.user?.name);
    const userPhone = cleanPhone(body.user?.phone);
    const source = body.source === 'diagnosis' ? 'diagnosis' : 'direct';
    const initialStatus = source === 'diagnosis' ? 'diy' : 'open';

    if (!category || !severity) {
      return res.status(400).json({ message: 'Issue category and severity are required' });
    }
    if (!userName || userPhone.length < 10) {
      return res.status(400).json({ message: 'Valid contact name and phone are required' });
    }

    let diagnosisSessionId: string | null = null;
    if (cleanText(body.diagnosisSessionId)) {
      const session = await query<{ id: string }>(
        `SELECT id FROM diagnosis_sessions WHERE id = $1 AND customer_user_id = $2 LIMIT 1`,
        [cleanText(body.diagnosisSessionId), userId]
      );
      diagnosisSessionId = session.rows[0]?.id ?? null;
    }

    const vehicleId = await resolveVehicleId(userId, body);
    const issueId = crypto.randomUUID();
    const summary = summarizeIssue(body);

    await query(
      `
        INSERT INTO issue_requests (
          id, customer_user_id, vehicle_id, diagnosis_session_id, summary, issue_source, issue_payload, status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
      `,
      [issueId, userId, vehicleId, diagnosisSessionId, summary, source, JSON.stringify(body), initialStatus]
    );

    return res.status(201).json({ issueId, message: 'Service intake submitted' });
  } catch (error) {
    if (error instanceof Error && /vehicle/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

marketplaceRouter.post('/issues', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const body = req.body as {
      vehicleId?: string;
      summary?: string;
      diagnosisSessionId?: string;
    };

    const vehicleId = body.vehicleId?.trim();
    const summary = body.summary?.trim();
    if (!vehicleId || !summary) {
      return res.status(400).json({ message: 'vehicleId and summary are required' });
    }

    const vehicle = await query<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, userId]
    );
    if (!vehicle.rows[0]) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    let diagnosisSessionId: string | null = null;
    if (body.diagnosisSessionId?.trim()) {
      const session = await query<{ id: string }>(
        `SELECT id FROM diagnosis_sessions WHERE id = $1 AND customer_user_id = $2 LIMIT 1`,
        [body.diagnosisSessionId.trim(), userId]
      );
      diagnosisSessionId = session.rows[0]?.id ?? null;
    }

    const issueId = crypto.randomUUID();
    const initialStatus = diagnosisSessionId ? 'diy' : 'open';
    await query(
      `
        INSERT INTO issue_requests (
          id, customer_user_id, vehicle_id, diagnosis_session_id, summary, status
        )
        VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [issueId, userId, vehicleId, diagnosisSessionId, summary, initialStatus]
    );

    return res.status(201).json({ issueId, message: 'Issue request created' });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.get('/issues', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const issues = await query<{
      id: string;
      summary: string;
      status: string;
      created_at: Date;
      quote_count: string;
    }>(
      `
        SELECT i.id, i.summary, i.status, i.created_at, COUNT(q.id)::text AS quote_count
        FROM issue_requests i
        LEFT JOIN quotes q ON q.issue_request_id = i.id
        WHERE i.customer_user_id = $1
        GROUP BY i.id
        ORDER BY i.created_at DESC
      `,
      [userId]
    );

    return res.json({
      issues: issues.rows.map((row) => ({
        id: row.id,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        quoteCount: Number(row.quote_count),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.get('/issues/:issueId', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { issueId } = req.params;

    const issue = await query<{
      id: string;
      summary: string;
      status: string;
      issue_source: 'diagnosis' | 'direct';
      issue_payload: Record<string, unknown>;
      created_at: Date;
      quote_count: string;
      make: string;
      model: string;
      year: number;
    }>(
      `
        SELECT
          i.id,
          i.summary,
          i.status,
          i.issue_source,
          i.issue_payload,
          i.created_at,
          COUNT(q.id)::text AS quote_count,
          v.make,
          v.model,
          v.year
        FROM issue_requests i
        INNER JOIN vehicles v ON v.id = i.vehicle_id
        LEFT JOIN quotes q ON q.issue_request_id = i.id
        WHERE i.id = $1 AND i.customer_user_id = $2
        GROUP BY i.id, v.id
        LIMIT 1
      `,
      [issueId, userId]
    );

    const row = issue.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Issue request not found' });
    }

    return res.json({
      issue: {
        id: row.id,
        summary: row.summary,
        status: row.status,
        source: row.issue_source,
        quoteCount: Number(row.quote_count),
        createdAt: row.created_at,
        vehicleLabel: `${row.year} ${row.make} ${row.model}`,
        issuePayload: row.issue_payload ?? {},
      },
    });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.post('/issues/:issueId/raise-to-garage', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { issueId } = req.params;

    const own = await query<{ id: string; status: string }>(
      `SELECT id, status FROM issue_requests WHERE id = $1 AND customer_user_id = $2 LIMIT 1`,
      [issueId, userId]
    );
    const row = own.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Issue request not found' });
    }
    if (row.status === 'quote_accepted') {
      return res.status(409).json({ message: 'Quote already accepted for this issue' });
    }

    await query(`UPDATE issue_requests SET status = 'quotes_pending', updated_at = NOW() WHERE id = $1`, [
      issueId,
    ]);

    return res.json({ message: 'Issue raised to garage' });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.get('/issues/:issueId/quotes', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { issueId } = req.params;

    const own = await query<{ id: string }>(
      `SELECT id FROM issue_requests WHERE id = $1 AND customer_user_id = $2 LIMIT 1`,
      [issueId, userId]
    );
    if (!own.rows[0]) {
      return res.status(404).json({ message: 'Issue request not found' });
    }

    const quotes = await query<{
      id: string;
      garage_name: string;
      garage_rating: string | null;
      distance_miles: string | null;
      parts_cost: string;
      labor_cost: string;
      total_cost: string;
      eta_note: string | null;
      comparison_label: string;
      status: string;
    }>(
      `
        SELECT q.id, g.business_name as garage_name, g.trust_score::text as garage_rating,
               '0' as distance_miles, q.parts_cost::text, q.labor_cost::text,
               q.total_cost::text, q.eta_note, q.comparison_label, q.status
        FROM quotes q
        LEFT JOIN garages g ON g.id = q.garage_id
        WHERE q.issue_request_id = $1
        ORDER BY q.total_cost ASC, q.created_at ASC
      `,
      [issueId]
    );

    return res.json({
      quotes: quotes.rows.map((row, index) => {
        const numericTotal = Number(row.total_cost);
        return {
          id: row.id,
          garageName: row.garage_name,
          garageRating: row.garage_rating ? Number(row.garage_rating).toFixed(1) : '4.5',
          distance: row.distance_miles ? Number(row.distance_miles) : 0,
          partsCost: Number(row.parts_cost),
          laborCost: Number(row.labor_cost),
          totalCost: numericTotal,
          comparisonLabel: row.comparison_label,
          isBestMatch: index === 0,
          status: row.status,
          eta: row.eta_note ?? 'Tomorrow',
        };
      }),
    });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.post('/quotes/:quoteId/select', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { quoteId } = req.params;

    const owned = await query<{
      quote_id: string;
      issue_request_id: string;
      garage_name: string;
      garage_id: string;
      total_cost: string;
      has_booking: string;
      existing_booking_id: string | null;
    }>(
      `
        SELECT
          q.id AS quote_id,
          q.issue_request_id,
          q.garage_id,
          COALESCE(g.business_name, 'Unknown Garage') as garage_name,
          q.total_cost::text,
          (
            SELECT COUNT(*)::text
            FROM bookings b
            WHERE b.quote_id = q.id
          ) AS has_booking,
          (
            SELECT b.id::text
            FROM bookings b
            WHERE b.quote_id = q.id
            LIMIT 1
          ) AS existing_booking_id
        FROM quotes q
        LEFT JOIN garages g ON g.id = q.garage_id
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        WHERE q.id = $1 AND i.customer_user_id = $2
        LIMIT 1
      `,
      [quoteId, userId]
    );

    const row = owned.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    const acceptedQuote = await query<{ id: string }>(
      `
        SELECT q.id
        FROM quotes q
        WHERE q.issue_request_id = $1
          AND q.status = 'selected'
        LIMIT 1
      `,
      [row.issue_request_id]
    );
    const selectedQuoteId = acceptedQuote.rows[0]?.id ?? null;
    if (selectedQuoteId && selectedQuoteId !== quoteId) {
      return res.status(409).json({ message: 'A quote has already been accepted for this issue' });
    }

    await query(
      `UPDATE quotes SET status = CASE WHEN id = $1 THEN 'selected' ELSE 'rejected' END WHERE issue_request_id = $2`,
      [quoteId, row.issue_request_id]
    );
    await query(`UPDATE issue_requests SET status = 'quote_accepted', updated_at = NOW() WHERE id = $1`, [
      row.issue_request_id,
    ]);

    if (Number(row.has_booking) > 0) {
      return res.json({ message: 'Quote selected', bookingId: row.existing_booking_id });
    }

    const bookingId = crypto.randomUUID();
    const garageNameColumnCheck = await query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'bookings'
            AND column_name = 'garage_name'
        ) AS exists
      `
    );
    const hasGarageNameColumn = garageNameColumnCheck.rows[0]?.exists === true;

    if (hasGarageNameColumn) {
      await query(
        `
          INSERT INTO bookings (
            id, quote_id, customer_user_id, garage_id, garage_name, appointment_time, checkin_mode, status
          )
          VALUES ($1,$2,$3,$4,$5,NOW() + INTERVAL '1 day','self_checkin','booked')
        `,
        [bookingId, quoteId, userId, row.garage_id, row.garage_name]
      );
    } else {
      await query(
        `
          INSERT INTO bookings (
            id, quote_id, customer_user_id, garage_id, appointment_time, checkin_mode, status
          )
          VALUES ($1,$2,$3,$4,NOW() + INTERVAL '1 day','self_checkin','booked')
        `,
        [bookingId, quoteId, userId, row.garage_id]
      );
    }

    return res.json({ message: 'Quote selected and booking created', bookingId });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.post('/quotes/:quoteId/cancel', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { quoteId } = req.params;

    const owned = await query<{
      quote_id: string;
      issue_request_id: string;
      status: string;
      booking_id: string | null;
    }>(
      `
        SELECT
          q.id AS quote_id,
          q.issue_request_id,
          q.status,
          (
            SELECT b.id::text
            FROM bookings b
            WHERE b.quote_id = q.id
            LIMIT 1
          ) AS booking_id
        FROM quotes q
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        WHERE q.id = $1 AND i.customer_user_id = $2
        LIMIT 1
      `,
      [quoteId, userId]
    );

    const row = owned.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    if (row.status !== 'selected') {
      return res.status(409).json({ message: 'Only an accepted quote can be cancelled' });
    }

    if (row.booking_id) {
      const paid = await query<{ id: string }>(
        `SELECT id FROM payments WHERE booking_id = $1 AND status = 'paid' LIMIT 1`,
        [row.booking_id]
      );
      if (paid.rows[0]) {
        return res.status(409).json({ message: 'Cannot cancel accepted quote after payment' });
      }

      await query(`DELETE FROM bookings WHERE id = $1`, [row.booking_id]);
    }

    await query(`UPDATE quotes SET status = 'pending' WHERE issue_request_id = $1`, [row.issue_request_id]);
    await query(`UPDATE issue_requests SET status = 'quotes_pending', updated_at = NOW() WHERE id = $1`, [
      row.issue_request_id,
    ]);

    return res.json({ message: 'Accepted quote cancelled successfully' });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.get('/bookings', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const bookings = await query<{
      id: string;
      quote_id: string;
      garage_name: string;
      appointment_time: Date;
      checkin_mode: string;
      status: string;
      total_cost: string;
      payment_status: string | null;
      make: string;
      model: string;
      year: number;
    }>(
      `
        SELECT
          b.id,
          b.quote_id,
          g.business_name as garage_name,
          b.appointment_time,
          b.checkin_mode,
          b.status,
          q.total_cost::text,
          p.status AS payment_status,
          v.make,
          v.model,
          v.year
        FROM bookings b
        INNER JOIN quotes q ON q.id = b.quote_id
        INNER JOIN garages g ON g.id = b.garage_id
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        INNER JOIN vehicles v ON v.id = i.vehicle_id
        LEFT JOIN payments p ON p.booking_id = b.id
        WHERE b.customer_user_id = $1
        ORDER BY b.created_at DESC
      `,
      [userId]
    );

    return res.json({
      bookings: bookings.rows.map((row) => ({
        id: row.id,
        quoteId: row.quote_id,
        vehicleStr: `${row.year} ${row.make} ${row.model}`,
        garageName: row.garage_name,
        appointmentTime: row.appointment_time,
        checkInMode: row.checkin_mode === 'home_pickup' ? 'Home Pickup' : 'Self Check-in',
        status: row.status,
        totalCost: `$${Number(row.total_cost).toFixed(2)}`,
        paymentStatus: row.payment_status ?? 'unpaid',
      })),
    });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.patch('/bookings/:bookingId', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { bookingId } = req.params;
    const body = req.body as {
      status?: 'cancelled' | 'booked' | 'in_service' | 'completed';
      appointmentTime?: string;
    };

    const owned = await query<{ id: string }>(
      `SELECT id FROM bookings WHERE id = $1 AND customer_user_id = $2 LIMIT 1`,
      [bookingId, userId]
    );
    if (!owned.rows[0]) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (body.status) {
      await query(`UPDATE bookings SET status = $2, updated_at = NOW() WHERE id = $1`, [
        bookingId,
        body.status,
      ]);
    }

    if (body.appointmentTime) {
      await query(`UPDATE bookings SET appointment_time = $2::timestamptz, updated_at = NOW() WHERE id = $1`, [
        bookingId,
        body.appointmentTime,
      ]);
    }

    return res.json({ message: 'Booking updated' });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.get('/parts', async (req, res, next) => {
  try {
    const rows = await query<{
      id: string;
      name: string;
      category: string;
      price: string;
      currency: string;
      supplier: string;
      in_stock: boolean;
    }>(
      `
        SELECT id, name, category, price::text, currency, supplier, in_stock
        FROM parts_catalog
        ORDER BY created_at DESC
      `
    );
    return res.json({
      parts: rows.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        price: Number(row.price),
        currency: row.currency,
        supplier: row.supplier,
        inStock: row.in_stock,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.get('/parts/orders', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const rows = await query<{
      id: string;
      part_name: string;
      qty: number;
      total_amount: string;
      status: string;
      created_at: Date;
    }>(
      `
        SELECT o.id, p.name AS part_name, o.qty, o.total_amount::text, o.status, o.created_at
        FROM part_orders o
        INNER JOIN parts_catalog p ON p.id = o.part_id
        WHERE o.customer_user_id = $1
        ORDER BY o.created_at DESC
      `,
      [userId]
    );
    return res.json({
      orders: rows.rows.map((row) => ({
        id: row.id,
        partName: row.part_name,
        qty: row.qty,
        totalAmount: Number(row.total_amount),
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

marketplaceRouter.post('/parts/:partId/order', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { partId } = req.params;
    const qty = Math.max(1, Number((req.body as { qty?: number }).qty ?? 1));

    const part = await query<{ id: string; price: string }>(
      `SELECT id, price::text FROM parts_catalog WHERE id = $1 AND in_stock = TRUE LIMIT 1`,
      [partId]
    );
    if (!part.rows[0]) {
      return res.status(404).json({ message: 'Part not found or out of stock' });
    }

    const id = crypto.randomUUID();
    const totalAmount = Number(part.rows[0].price) * qty;
    await query(
      `
        INSERT INTO part_orders (id, customer_user_id, part_id, qty, total_amount, status)
        VALUES ($1,$2,$3,$4,$5,'placed')
      `,
      [id, userId, partId, qty, totalAmount]
    );
    return res.status(201).json({ message: 'Order placed', orderId: id });
  } catch (error) {
    return next(error);
  }
});

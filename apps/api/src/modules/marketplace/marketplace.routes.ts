import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../../db/postgres';
import { requireAuth, requireRole } from '../auth/auth.middleware';

export const marketplaceRouter = Router();

marketplaceRouter.use(requireAuth, requireRole('user'));

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
    await query(
      `
        INSERT INTO issue_requests (
          id, customer_user_id, vehicle_id, diagnosis_session_id, summary, status
        )
        VALUES ($1,$2,$3,$4,$5,'open')
      `,
      [issueId, userId, vehicleId, diagnosisSessionId, summary]
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
        SELECT id, garage_name, garage_rating::text, distance_miles::text, parts_cost::text,
               labor_cost::text, total_cost::text, eta_note, comparison_label, status
        FROM quotes
        WHERE issue_request_id = $1
        ORDER BY total_cost ASC, created_at ASC
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
      total_cost: string;
      has_booking: string;
    }>(
      `
        SELECT
          q.id AS quote_id,
          q.issue_request_id,
          q.garage_name,
          q.total_cost::text,
          (
            SELECT COUNT(*)::text
            FROM bookings b
            WHERE b.quote_id = q.id
          ) AS has_booking
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

    await query(
      `UPDATE quotes SET status = CASE WHEN id = $1 THEN 'selected' ELSE 'rejected' END WHERE issue_request_id = $2`,
      [quoteId, row.issue_request_id]
    );
    await query(`UPDATE issue_requests SET status = 'quoted', updated_at = NOW() WHERE id = $1`, [
      row.issue_request_id,
    ]);

    if (Number(row.has_booking) > 0) {
      return res.json({ message: 'Quote selected' });
    }

    const bookingId = crypto.randomUUID();
    await query(
      `
        INSERT INTO bookings (
          id, quote_id, customer_user_id, garage_name, appointment_time, checkin_mode, status
        )
        VALUES ($1,$2,$3,$4,NOW() + INTERVAL '1 day','self_checkin','booked')
      `,
      [bookingId, quoteId, userId, row.garage_name]
    );
    await query(`UPDATE issue_requests SET status = 'booked', updated_at = NOW() WHERE id = $1`, [
      row.issue_request_id,
    ]);

    return res.json({ message: 'Quote selected and booking created', bookingId });
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
          b.garage_name,
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

import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../../db/postgres';
import { requireAuth, requireRole } from '../auth/auth.middleware';

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth, requireRole('user'));

paymentsRouter.get('/transactions', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const rows = await query<{
      id: string;
      created_at: Date;
      status: string;
      amount: string;
      method: string;
      garage_name: string;
      make: string;
      model: string;
      year: number;
    }>(
      `
        SELECT
          p.id,
          p.created_at,
          p.status,
          p.amount::text,
          p.method,
          b.garage_name,
          v.make,
          v.model,
          v.year
        FROM payments p
        INNER JOIN bookings b ON b.id = p.booking_id
        INNER JOIN quotes q ON q.id = b.quote_id
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        INNER JOIN vehicles v ON v.id = i.vehicle_id
        WHERE p.customer_user_id = $1
        ORDER BY p.created_at DESC
      `,
      [userId]
    );

    return res.json({
      transactions: rows.rows.map((row) => ({
        id: row.id,
        date: row.created_at,
        service: `${row.garage_name} - ${row.year} ${row.make} ${row.model}`,
        amount: Number(row.amount),
        status: row.status,
        method: row.method,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.get('/summary', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const rows = await query<{
      total_spent: string;
      paid_count: string;
    }>(
      `
        SELECT
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END),0)::text AS total_spent,
          COUNT(*) FILTER (WHERE status = 'paid')::text AS paid_count
        FROM payments
        WHERE customer_user_id = $1
      `,
      [userId]
    );
    return res.json({
      summary: {
        totalSpent: Number(rows.rows[0]?.total_spent ?? 0),
        paidCount: Number(rows.rows[0]?.paid_count ?? 0),
      },
    });
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.post('/intent', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const body = req.body as { bookingId?: string; method?: string };
    const bookingId = body.bookingId?.trim();
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    const method = (body.method ?? 'card').trim().toLowerCase();

    const booking = await query<{
      id: string;
      total_cost: string;
      garage_name: string;
      make: string;
      model: string;
      year: number;
    }>(
      `
        SELECT
          b.id,
          q.total_cost::text,
          b.garage_name,
          v.make,
          v.model,
          v.year
        FROM bookings b
        INNER JOIN quotes q ON q.id = b.quote_id
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        INNER JOIN vehicles v ON v.id = i.vehicle_id
        WHERE b.id = $1 AND b.customer_user_id = $2
        LIMIT 1
      `,
      [bookingId, userId]
    );

    const row = booking.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const existingPayment = await query<{ id: string }>(
      `SELECT id FROM payments WHERE booking_id = $1 AND status = 'paid' LIMIT 1`,
      [bookingId]
    );
    if (existingPayment.rows[0]) {
      return res.status(409).json({ message: 'Booking is already paid' });
    }

    const intentId = crypto.randomUUID();
    const clientSecret = `dummy_secret_${intentId.replace(/-/g, '')}`;

    await query(
      `
        INSERT INTO payment_intents (
          id, booking_id, customer_user_id, amount, currency, method, status, client_secret
        )
        VALUES ($1,$2,$3,$4,'USD',$5,'created',$6)
      `,
      [
        intentId,
        bookingId,
        userId,
        Number(row.total_cost),
        method,
        clientSecret,
      ]
    );

    return res.status(201).json({
      intentId,
      clientSecret,
      bookingId,
      amount: Number(row.total_cost),
      currency: 'USD',
      method,
      garageName: row.garage_name,
      vehicleStr: `${row.year} ${row.make} ${row.model}`,
    });
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.get('/intents/:intentId', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { intentId } = req.params;

    const intent = await query<{
      id: string;
      booking_id: string;
      amount: string;
      currency: string;
      method: string;
      status: string;
      garage_name: string;
      make: string;
      model: string;
      year: number;
    }>(
      `
        SELECT
          pi.id,
          pi.booking_id,
          pi.amount::text,
          pi.currency,
          pi.method,
          pi.status,
          b.garage_name,
          v.make,
          v.model,
          v.year
        FROM payment_intents pi
        INNER JOIN bookings b ON b.id = pi.booking_id
        INNER JOIN quotes q ON q.id = b.quote_id
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        INNER JOIN vehicles v ON v.id = i.vehicle_id
        WHERE pi.id = $1 AND pi.customer_user_id = $2
        LIMIT 1
      `,
      [intentId, userId]
    );

    const row = intent.rows[0];
    if (!row) {
      return res.status(404).json({ message: 'Payment intent not found' });
    }

    return res.json({
      intent: {
        id: row.id,
        bookingId: row.booking_id,
        amount: Number(row.amount),
        currency: row.currency,
        method: row.method,
        status: row.status,
        garageName: row.garage_name,
        vehicleStr: `${row.year} ${row.make} ${row.model}`,
      },
    });
  } catch (error) {
    return next(error);
  }
});

paymentsRouter.post('/confirm', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const body = req.body as { intentId?: string };
    const intentId = body.intentId?.trim();
    if (!intentId) {
      return res.status(400).json({ message: 'intentId is required' });
    }

    const intent = await query<{
      id: string;
      booking_id: string;
      amount: string;
      method: string;
      status: string;
      expires_at: Date;
    }>(
      `
        SELECT id, booking_id, amount::text, method, status, expires_at
        FROM payment_intents
        WHERE id = $1 AND customer_user_id = $2
        LIMIT 1
      `,
      [intentId, userId]
    );
    const intentRow = intent.rows[0];
    if (!intentRow) {
      return res.status(404).json({ message: 'Payment intent not found' });
    }
    if (intentRow.status === 'confirmed') {
      const payment = await query<{ id: string }>(
        `SELECT id FROM payments WHERE booking_id = $1 LIMIT 1`,
        [intentRow.booking_id]
      );
      return res.json({
        message: 'Payment already confirmed',
        paymentId: payment.rows[0]?.id,
      });
    }
    if (intentRow.status !== 'created') {
      return res.status(400).json({ message: 'Intent is not payable' });
    }
    if (new Date(intentRow.expires_at).getTime() < Date.now()) {
      await query(
        `UPDATE payment_intents SET status = 'expired', updated_at = NOW() WHERE id = $1`,
        [intentId]
      );
      return res.status(400).json({ message: 'Payment intent expired' });
    }

    const existingPayment = await query<{ id: string }>(
      `SELECT id FROM payments WHERE booking_id = $1 LIMIT 1`,
      [intentRow.booking_id]
    );

    let paymentId = existingPayment.rows[0]?.id;
    if (paymentId) {
      await query(
        `UPDATE payments SET status = 'paid', method = $2, updated_at = NOW() WHERE id = $1`,
        [paymentId, intentRow.method]
      );
    } else {
      paymentId = crypto.randomUUID();
      await query(
        `
          INSERT INTO payments (
            id, booking_id, customer_user_id, amount, currency, method, status, receipt_number
          )
          VALUES ($1,$2,$3,$4,'USD',$5,'paid',$6)
        `,
        [
          paymentId,
          intentRow.booking_id,
          userId,
          Number(intentRow.amount),
          intentRow.method,
          `RCT-${Date.now()}`,
        ]
      );
    }

    await query(
      `UPDATE payment_intents SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [intentId]
    );
    await query(`UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [
      intentRow.booking_id,
    ]);

    return res.json({ message: 'Payment successful', paymentId, bookingId: intentRow.booking_id });
  } catch (error) {
    return next(error);
  }
});

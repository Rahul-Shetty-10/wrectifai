import { Router } from 'express';
import { success, error } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { query } from '../../config/database';

export const bookingsRouter = Router();

// GET /bookings — list all bookings globally
bookingsRouter.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        b.id,
        b.customer_id as "customerId",
        b.garage_id as "garageId",
        b.vehicle_id as "vehicleId",
        b.quote_id as "quoteId",
        b.booking_type as "bookingType",
        b.scheduled_at as "scheduledAt",
        b.status,
        b.total_amount as "totalAmount",
        b.currency,
        b.created_at as "createdAt",
        b.updated_at as "updatedAt",
        g.name as "garageName",
        g.address as "garageAddress",
        v.make as "vehicleMake",
        v.model as "vehicleModel",
        v.year as "vehicleYear"
       FROM bookings b
       JOIN garages g ON b.garage_id = g.id
       JOIN vehicles v ON b.vehicle_id = v.id
       ORDER BY b.scheduled_at DESC`,
      []
    );

    const formatted = result.rows.map((row) => ({
      ...row,
      totalAmount: Number(row.totalAmount),
    }));

    return success(res, formatted, 200);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to retrieve bookings',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});

// GET /bookings/:bookingId — retrieve detailed booking by ID
bookingsRouter.get('/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await query(
      `SELECT 
        b.id,
        b.customer_id as "customerId",
        b.garage_id as "garageId",
        b.vehicle_id as "vehicleId",
        b.quote_id as "quoteId",
        b.booking_type as "bookingType",
        b.scheduled_at as "scheduledAt",
        b.status,
        b.total_amount as "totalAmount",
        b.currency,
        b.created_at as "createdAt",
        b.updated_at as "updatedAt",
        g.name as "garageName",
        g.address as "garageAddress",
        v.make as "vehicleMake",
        v.model as "vehicleModel",
        v.year as "vehicleYear"
       FROM bookings b
       JOIN garages g ON b.garage_id = g.id
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return error(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    const row = result.rows[0];
    const formatted = {
      ...row,
      totalAmount: Number(row.totalAmount),
    };

    return success(res, formatted, 200);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to retrieve booking',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});

// Helper for booking creation logic
async function createBookingInternal(req: any, res: any, data: {
  garageId?: string;
  vehicleId: string;
  scheduledAt: string;
  totalAmount: number;
  bookingType: string;
  quoteId?: string | null;
  currency?: string;
}) {
  const customerId = req.user?.userId;
  let { garageId } = data;
  const { vehicleId, scheduledAt, totalAmount, bookingType, quoteId, currency } = data;

  if (!vehicleId || !scheduledAt || !totalAmount || !bookingType) {
    return error(res, 'Missing required booking fields', 'BAD_REQUEST', 400);
  }

  // If quoteId is provided, lookup the garageId from the quote if not provided
  if (quoteId) {
    try {
      const quoteResult = await query('SELECT garage_id FROM quotes WHERE id = $1', [quoteId]);
      if (quoteResult.rows.length > 0) {
        if (!garageId) {
          garageId = quoteResult.rows[0].garage_id;
        }
        // Update quote status to 'selected'
        await query("UPDATE quotes SET status = 'selected' WHERE id = $1", [quoteId]);
      }
    } catch (err) {
      console.error('Failed quote association processing:', err);
    }
  }

  if (!garageId) {
    return error(res, 'Garage ID is required to create a booking', 'BAD_REQUEST', 400);
  }

  try {
    const result = await query(
      `INSERT INTO bookings (customer_id, garage_id, vehicle_id, quote_id, booking_type, scheduled_at, status, total_amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, $8)
       RETURNING id, customer_id as "customerId", garage_id as "garageId", vehicle_id as "vehicleId", quote_id as "quoteId", booking_type as "bookingType", scheduled_at as "scheduledAt", status, total_amount as "totalAmount", currency, created_at as "createdAt"`,
      [
        customerId,
        garageId,
        vehicleId,
        quoteId || null,
        bookingType,
        scheduledAt,
        totalAmount,
        currency || 'USD',
      ]
    );

    const row = result.rows[0];
    return success(
      res,
      {
        ...row,
        totalAmount: Number(row.totalAmount),
      },
      201
    );
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to create booking',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
}

// POST /bookings — create a booking
bookingsRouter.post('/', authenticate, async (req, res) => {
  return createBookingInternal(req, res, req.body);
});

// POST /bookings/instant — legacy/instant booking alias
bookingsRouter.post('/instant', authenticate, async (req, res) => {
  const { garageId, vehicleId, scheduledAt, totalAmount, currency } = req.body;
  return createBookingInternal(req, res, {
    garageId,
    vehicleId,
    scheduledAt,
    totalAmount,
    bookingType: 'instant',
    quoteId: null,
    currency,
  });
});

// POST /bookings/from-quote/:quoteId — booking from quote alias
bookingsRouter.post('/from-quote/:quoteId', authenticate, async (req, res) => {
  const { quoteId } = req.params;
  const { vehicleId, scheduledAt, totalAmount, currency } = req.body;
  return createBookingInternal(req, res, {
    vehicleId,
    scheduledAt,
    totalAmount,
    bookingType: 'quoteBased',
    quoteId,
    currency,
  });
});

// PATCH /bookings/:bookingId/status — update status
bookingsRouter.patch('/:bookingId/status', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pendingPayment', 'confirmed', 'inService', 'completed', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return error(res, `Invalid or missing status. Allowed values: ${allowedStatuses.join(', ')}`, 'BAD_REQUEST', 400);
    }

    const result = await query(
      `UPDATE bookings
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at as "updatedAt"`,
      [status, bookingId]
    );

    if (result.rows.length === 0) {
      return error(res, 'Booking not found', 'NOT_FOUND', 404);
    }

    return success(res, result.rows[0], 200);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to update booking status',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});

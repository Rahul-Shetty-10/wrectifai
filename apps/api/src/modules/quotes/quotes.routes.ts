import { Router } from 'express';
import { success, error } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { query } from '../../config/database';

export const quotesRouter = Router();

quotesRouter.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT q.id, q.quote_request_id as "quoteRequestId", q.amount, q.currency, q.eta_days as "etaDays", q.status, q.created_at as "createdAt", q.details,
              g.name as "garageName", g.rating_avg as "ratingAvg", g.rating_count as "ratingCount", g.pickup_drop_supported as "pickupDropSupported",
              qr.created_at as "requestCreatedAt", qr.issue_summary as "requestIssueSummary",
              v.make as "vehicleMake", v.model as "vehicleModel", v.year as "vehicleYear", v.vin as "vehicleVin", v.mileage as "vehicleMileage"
       FROM quotes q
       JOIN garages g ON q.garage_id = g.id
       JOIN quote_requests qr ON q.quote_request_id = qr.id
       LEFT JOIN vehicles v ON qr.vehicle_id = v.id
       ORDER BY q.created_at DESC`
    );

    const mapped = result.rows.map((row: Record<string, any>) => {
      const details = row.details || {};
      const amountNum = Number(row.amount);
      const savingsNum = Number(details.savings || 0);

      return {
        id: row.id,
        quoteRequestId: row.quoteRequestId,
        status: details.ui_status || 'open',
        garage: row.garageName,
        image: details.image || '/assets/garage_1_1778071156220.png',
        rating: String(row.ratingAvg || '4.5'),
        reviews: Number(row.ratingCount || 0),
        distance: details.distance || '3.0 km away',
        meta: details.tag || 'Certified technicians',
        metaSecondary: details.warranty || '6 Months warranty',
        price: `$${amountNum.toLocaleString('en-US')}`,
        savings: `$${savingsNum.toLocaleString('en-US')}`,
        time: details.availability || '10 mins ago',
        tag: details.tag || undefined,
        requestCreatedAt: row.requestCreatedAt,
        requestIssueSummary: row.requestIssueSummary,
        vehicle: row.vehicleMake ? {
          make: row.vehicleMake,
          model: row.vehicleModel,
          year: row.vehicleYear,
          vin: row.vehicleVin,
          mileage: row.vehicleMileage
        } : null,
        details: {
          parts: details.parts,
          labour: details.labour,
          consumables: details.consumables,
          gst: details.gst,
          availability: details.availability,
          pickupDrop: details.pickup_drop,
          warranty: details.warranty,
          experience: details.experience,
        }
      };
    });

    return success(res, mapped);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Database query failed',
      'DATABASE_ERROR',
      500
    );
  }
});

quotesRouter.post('/requests', authenticate, async (req, res) => {
  try {
    const { vehicleId, issueSummary, diagnosisRequestId, preferredDate } = req.body;
    if (!vehicleId || !issueSummary) {
      return error(res, 'Vehicle ID and Issue Summary are required', 'BAD_REQUEST', 400);
    }

    const customerId = req.user?.userId;
    if (!customerId) {
      return error(res, 'Authentication failed: no customer ID found', 'UNAUTHORIZED', 401);
    }

    // Verify vehicle exists
    const vehicleRes = await query(
      'SELECT id FROM vehicles WHERE id = $1',
      [vehicleId]
    );
    if (vehicleRes.rows.length === 0) {
      return error(res, 'Vehicle not found', 'BAD_REQUEST', 400);
    }

    const result = await query(
      `INSERT INTO quote_requests (customer_id, vehicle_id, diagnosis_request_id, issue_summary, preferred_date, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING id, customer_id as "customerId", vehicle_id as "vehicleId", diagnosis_request_id as "diagnosisRequestId", issue_summary as "issueSummary", preferred_date as "preferredDate", status, created_at as "createdAt"`,
      [customerId, vehicleId, diagnosisRequestId || null, issueSummary, preferredDate || null]
    );

    const newRequest = result.rows[0];

    // Mock Quote Generation: Insert 3 mock quotes from existing garages in the DB for the newly created quote request
    const garagesRes = await query('SELECT id, name FROM garages LIMIT 3');
    if (garagesRes.rows.length >= 3) {
      const templates = [
        {
          amount: 3050.00,
          details: {
            ui_status: "new",
            parts: 1650,
            labour: 1050,
            consumables: 200,
            gst: 150,
            availability: "Today, 6:00 PM",
            pickup_drop: "Available",
            warranty: "6 Months / 10,000 km",
            experience: "8+ Years",
            savings: 450,
            tag: "Express service",
            image: "/assets/garage_2_1778071173295.png"
          }
        },
        {
          amount: 3450.00,
          details: {
            ui_status: "new",
            parts: 1900,
            labour: 1250,
            consumables: 250,
            gst: 200,
            availability: "Tomorrow, 10:00 AM",
            pickup_drop: "Not Available",
            warranty: "3 Months / 5,000 km",
            experience: "6+ Years",
            savings: 250,
            tag: "Specialized repair",
            image: "/assets/garage_3_1778071191282.png"
          }
        },
        {
          amount: 3200.00,
          details: {
            ui_status: "new",
            parts: 1700,
            labour: 1200,
            consumables: 200,
            gst: 100,
            availability: "Today, 7:30 PM",
            pickup_drop: "Available",
            warranty: "2 Years / 20,000 km",
            experience: "10+ Years",
            savings: 150,
            tag: "Free pickup & drop",
            image: "/assets/garage_1_1778071156220.png"
          }
        }
      ];

      for (let i = 0; i < 3; i++) {
        const garage = garagesRes.rows[i];
        const template = templates[i];
        await query(
          `INSERT INTO quotes (quote_request_id, garage_id, amount, currency, eta_days, status, details)
           VALUES ($1, $2, $3, 'USD', $4, 'active', $5)`,
          [
            newRequest.id,
            garage.id,
            template.amount,
            i === 1 ? 2 : 1,
            JSON.stringify(template.details)
          ]
        );
      }

      // Update the quote_request status to 'quoted' since quotes are now available
      await query(
        `UPDATE quote_requests SET status = 'quoted' WHERE id = $1`,
        [newRequest.id]
      );
      newRequest.status = 'quoted';
    }

    return success(res, newRequest, 201);
  } catch (err: any) {
    console.error('Quote request creation failed:', err);
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to create quote request',
      'DATABASE_ERROR',
      500
    );
  }
});

// List Requests Endpoint: Retrieve all quote requests for the authenticated user (sorted by created_at DESC)
quotesRouter.get('/requests', authenticate, async (req, res) => {
  try {
    const customerId = req.user?.userId;
    if (!customerId) {
      return error(res, 'Authentication failed: no customer ID found', 'UNAUTHORIZED', 401);
    }

    const result = await query(
      `SELECT qr.id, qr.customer_id as "customerId", qr.vehicle_id as "vehicleId", qr.issue_summary as "issueSummary", qr.status, qr.created_at as "createdAt",
              v.make as "vehicleMake", v.model as "vehicleModel", v.year as "vehicleYear", v.vin as "vehicleVin", v.mileage as "vehicleMileage"
       FROM quote_requests qr
       LEFT JOIN vehicles v ON qr.vehicle_id = v.id
       WHERE qr.customer_id = $1
       ORDER BY qr.created_at DESC`,
      [customerId]
    );

    const mapped = result.rows.map((row: any) => ({
      id: row.id,
      customerId: row.customerId,
      vehicleId: row.vehicleId,
      issueSummary: row.issueSummary,
      status: row.status,
      createdAt: row.createdAt,
      vehicle: row.vehicleMake ? {
        make: row.vehicleMake,
        model: row.vehicleModel,
        year: row.vehicleYear,
        vin: row.vehicleVin,
        mileage: row.vehicleMileage
      } : null
    }));

    return success(res, mapped);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Database query failed',
      'DATABASE_ERROR',
      500
    );
  }
});

quotesRouter.get('/requests/:requestId', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT qr.id, qr.customer_id as "customerId", qr.vehicle_id as "vehicleId", qr.issue_summary as "issueSummary", qr.status, qr.created_at as "createdAt",
              v.make as "vehicleMake", v.model as "vehicleModel", v.year as "vehicleYear", v.vin as "vehicleVin", v.mileage as "vehicleMileage"
       FROM quote_requests qr
       LEFT JOIN vehicles v ON qr.vehicle_id = v.id
       WHERE qr.id = $1`,
      [req.params.requestId]
    );

    if (result.rows.length === 0) {
      return error(res, 'Quote request not found', 'NOT_FOUND', 404);
    }

    const row = result.rows[0];
    return success(res, {
      id: row.id,
      customerId: row.customerId,
      vehicleId: row.vehicleId,
      issueSummary: row.issueSummary,
      status: row.status,
      createdAt: row.createdAt,
      vehicle: row.vehicleMake ? {
        make: row.vehicleMake,
        model: row.vehicleModel,
        year: row.vehicleYear,
        vin: row.vehicleVin,
        mileage: row.vehicleMileage
      } : null
    });
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Database query failed',
      'DATABASE_ERROR',
      500
    );
  }
});

quotesRouter.get('/:quoteId', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT q.id, q.quote_request_id as "quoteRequestId", q.amount, q.currency, q.eta_days as "etaDays", q.status, q.created_at as "createdAt", q.details,
              g.name as "garageName", g.rating_avg as "ratingAvg", g.rating_count as "ratingCount", g.pickup_drop_supported as "pickupDropSupported",
              qr.created_at as "requestCreatedAt", qr.issue_summary as "requestIssueSummary",
              v.make as "vehicleMake", v.model as "vehicleModel", v.year as "vehicleYear", v.vin as "vehicleVin", v.mileage as "vehicleMileage"
       FROM quotes q
       JOIN garages g ON q.garage_id = g.id
       JOIN quote_requests qr ON q.quote_request_id = qr.id
       LEFT JOIN vehicles v ON qr.vehicle_id = v.id
       WHERE q.id = $1`,
      [req.params.quoteId]
    );

    if (result.rows.length === 0) {
      return error(res, 'Quote not found', 'NOT_FOUND', 404);
    }

    const row = result.rows[0];
    const details = row.details || {};
    const amountNum = Number(row.amount);
    const savingsNum = Number(details.savings || 0);

    const mapped = {
      id: row.id,
      quoteRequestId: row.quoteRequestId,
      status: details.ui_status || 'open',
      garage: row.garageName,
      image: details.image || '/assets/garage_1_1778071156220.png',
      rating: String(row.ratingAvg || '4.5'),
      reviews: Number(row.ratingCount || 0),
      distance: details.distance || '3.0 km away',
      meta: details.tag || 'Certified technicians',
      metaSecondary: details.warranty || '6 Months warranty',
      price: `$${amountNum.toLocaleString('en-US')}`,
      savings: `$${savingsNum.toLocaleString('en-US')}`,
      time: details.availability || '10 mins ago',
      tag: details.tag || undefined,
      requestCreatedAt: row.requestCreatedAt,
      requestIssueSummary: row.requestIssueSummary,
      vehicle: row.vehicleMake ? {
        make: row.vehicleMake,
        model: row.vehicleModel,
        year: row.vehicleYear,
        vin: row.vehicleVin,
        mileage: row.vehicleMileage
      } : null,
      details: {
        parts: details.parts,
        labour: details.labour,
        consumables: details.consumables,
        gst: details.gst,
        availability: details.availability,
        pickupDrop: details.pickup_drop,
        warranty: details.warranty,
        experience: details.experience,
      }
    };

    return success(res, mapped);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Database query failed',
      'DATABASE_ERROR',
      500
    );
  }
});


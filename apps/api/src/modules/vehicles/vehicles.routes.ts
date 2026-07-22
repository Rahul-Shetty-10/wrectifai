import { Router } from 'express';
import { success, error } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { query } from '../../config/database';

export const vehiclesRouter = Router();

// GET /vehicles — list all active vehicles
vehiclesRouter.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, customer_id as "customerId", make, model, year, vin, mileage, warranty, created_at as "createdAt", updated_at as "updatedAt"
       FROM vehicles
       WHERE is_active = true
       ORDER BY created_at DESC`,
      []
    );

    return success(res, result.rows, 200);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to retrieve vehicles',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});

// POST /vehicles — add vehicle
vehiclesRouter.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return error(res, 'User ID missing from authentication token', 'UNAUTHORIZED', 401);
    }

    const { make, model, year, vin, mileage, warranty } = req.body;
    if (!make || !model || !year) {
      return error(res, 'Make, model, and year are required fields', 'BAD_REQUEST', 400);
    }

    const result = await query(
      `INSERT INTO vehicles (customer_id, make, model, year, vin, mileage, warranty, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, customer_id as "customerId", make, model, year, vin, mileage, warranty, created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, make, model, year, vin || null, mileage || null, warranty ? JSON.stringify(warranty) : null]
    );

    return success(res, result.rows[0], 201);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to add vehicle',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});

// GET /vehicles/:vehicleId — get single vehicle details
vehiclesRouter.get('/:vehicleId', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { vehicleId } = req.params;

    if (!userId) {
      return error(res, 'User ID missing from authentication token', 'UNAUTHORIZED', 401);
    }

    const result = await query(
      `SELECT id, customer_id as "customerId", make, model, year, vin, mileage, warranty, created_at as "createdAt", updated_at as "updatedAt", is_active
       FROM vehicles
       WHERE id = $1`,
      [vehicleId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return error(res, 'Vehicle not found', 'NOT_FOUND', 404);
    }

    const vehicle = result.rows[0];


    // Omit is_active in response matching design client
    const { is_active, ...vehicleData } = vehicle;
    return success(res, vehicleData, 200);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to retrieve vehicle',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});

// PATCH /vehicles/:vehicleId — update vehicle
vehiclesRouter.patch('/:vehicleId', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { vehicleId } = req.params;

    if (!userId) {
      return error(res, 'User ID missing from authentication token', 'UNAUTHORIZED', 401);
    }

    // 1. Check ownership & existence
    const verifyResult = await query(
      `SELECT customer_id as "customerId", is_active FROM vehicles WHERE id = $1`,
      [vehicleId]
    );

    if (verifyResult.rows.length === 0 || !verifyResult.rows[0].is_active) {
      return error(res, 'Vehicle not found', 'NOT_FOUND', 404);
    }



    // 2. Perform partial update
    const { make, model, year, vin, mileage, warranty } = req.body;

    const result = await query(
      `UPDATE vehicles
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           year = COALESCE($3, year),
           vin = COALESCE($4, vin),
           mileage = COALESCE($5, mileage),
           warranty = COALESCE($6, warranty),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, customer_id as "customerId", make, model, year, vin, mileage, warranty, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        make !== undefined ? make : null,
        model !== undefined ? model : null,
        year !== undefined ? year : null,
        vin !== undefined ? vin : null,
        mileage !== undefined ? mileage : null,
        warranty !== undefined ? (warranty ? JSON.stringify(warranty) : null) : null,
        vehicleId,
      ]
    );

    return success(res, result.rows[0], 200);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to update vehicle',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});

// DELETE /vehicles/:vehicleId — soft delete vehicle
vehiclesRouter.delete('/:vehicleId', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { vehicleId } = req.params;

    if (!userId) {
      return error(res, 'User ID missing from authentication token', 'UNAUTHORIZED', 401);
    }

    // 1. Check ownership & existence
    const verifyResult = await query(
      `SELECT customer_id as "customerId", is_active FROM vehicles WHERE id = $1`,
      [vehicleId]
    );

    if (verifyResult.rows.length === 0 || !verifyResult.rows[0].is_active) {
      return error(res, 'Vehicle not found', 'NOT_FOUND', 404);
    }



    // 2. Mark inactive
    await query(
      `UPDATE vehicles SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [vehicleId]
    );

    return success(res, { success: true }, 200);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to delete vehicle',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
});


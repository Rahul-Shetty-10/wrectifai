import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../../db/postgres';
import { requireAuth, requireRole } from '../auth/auth.middleware';

export const vehiclesRouter = Router();

vehiclesRouter.use(requireAuth, requireRole('user'));

vehiclesRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const search = ((req.query.search as string | undefined) ?? '').trim();

    const params: unknown[] = [userId];
    let where = 'WHERE v.user_id = $1';

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where +=
        ' AND (LOWER(v.make) LIKE $2 OR LOWER(v.model) LIKE $2 OR LOWER(COALESCE(v.trim,\'\')) LIKE $2 OR LOWER(COALESCE(v.vin,\'\')) LIKE $2 OR LOWER(COALESCE(v.plate_number,\'\')) LIKE $2)';
    }

    const vehicles = await query<{
      id: string;
      make: string;
      model: string;
      year: number;
      fuel_type: string;
      mileage: number | null;
      trim: string | null;
      engine_type: string | null;
      vin: string | null;
      plate_number: string | null;
      is_default: boolean;
      created_at: Date;
      history_count: string;
    }>(
      `
        SELECT
          v.id,
          v.make,
          v.model,
          v.year,
          v.fuel_type,
          v.mileage,
          v.trim,
          v.engine_type,
          v.vin,
          v.plate_number,
          v.is_default,
          v.created_at,
          COUNT(h.id)::text AS history_count
        FROM vehicles v
        LEFT JOIN vehicle_repair_history h ON h.vehicle_id = v.id
        ${where}
        GROUP BY v.id
        ORDER BY v.is_default DESC, v.created_at DESC
      `,
      params
    );

    return res.json({
      vehicles: vehicles.rows.map((row) => ({
        id: row.id,
        make: row.make,
        model: row.model,
        year: row.year,
        fuelType: row.fuel_type,
        mileage: row.mileage,
        trim: row.trim,
        engineType: row.engine_type,
        vin: row.vin,
        plateNumber: row.plate_number,
        isDefault: row.is_default,
        historyCount: Number(row.history_count),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

vehiclesRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const body = req.body as {
      make?: string;
      model?: string;
      year?: number;
      fuelType?: string;
      mileage?: number;
      trim?: string;
      engineType?: string;
      vin?: string;
      plateNumber?: string;
      isDefault?: boolean;
    };

    const make = body.make?.trim();
    const model = body.model?.trim();
    const year = Number(body.year);
    const fuelType = body.fuelType?.trim();

    if (!make || !model || !fuelType || !Number.isInteger(year)) {
      return res.status(400).json({ message: 'make, model, year and fuelType are required' });
    }
    const currentYear = new Date().getFullYear() + 1;
    if (year < 1980 || year > currentYear) {
      return res.status(400).json({ message: 'year is out of valid range' });
    }

    const id = crypto.randomUUID();
    const isDefault = Boolean(body.isDefault);
    const mileage = Number(body.mileage);

    await query(
      `
        WITH clear_defaults AS (
          UPDATE vehicles
          SET is_default = FALSE
          WHERE user_id = $2 AND $12::boolean = TRUE
        )
        INSERT INTO vehicles (
          id, user_id, make, model, year, fuel_type,
          mileage, trim, engine_type, vin, plate_number, is_default
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        id,
        userId,
        make,
        model,
        year,
        fuelType,
        Number.isFinite(mileage) ? mileage : null,
        body.trim?.trim() || null,
        body.engineType?.trim() || null,
        body.vin?.trim() || null,
        body.plateNumber?.trim() || null,
        isDefault,
      ]
    );

    return res.status(201).json({ message: 'Vehicle added', vehicleId: id });
  } catch (error) {
    return next(error);
  }
});

vehiclesRouter.patch('/:vehicleId', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { vehicleId } = req.params;
    const body = req.body as {
      make?: string;
      model?: string;
      year?: number;
      fuelType?: string;
      mileage?: number;
      trim?: string;
      engineType?: string;
      vin?: string;
      plateNumber?: string;
    };

    const owned = await query<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, userId]
    );
    if (!owned.rows[0]) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await query(
      `
        UPDATE vehicles
        SET
          make = COALESCE(NULLIF($3,''), make),
          model = COALESCE(NULLIF($4,''), model),
          year = COALESCE($5, year),
          fuel_type = COALESCE(NULLIF($6,''), fuel_type),
          mileage = COALESCE($7, mileage),
          trim = COALESCE($8, trim),
          engine_type = COALESCE($9, engine_type),
          vin = COALESCE($10, vin),
          plate_number = COALESCE($11, plate_number),
          updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `,
      [
        vehicleId,
        userId,
        body.make?.trim() ?? '',
        body.model?.trim() ?? '',
        Number.isInteger(Number(body.year)) ? Number(body.year) : null,
        body.fuelType?.trim() ?? '',
        Number.isFinite(Number(body.mileage)) ? Number(body.mileage) : null,
        body.trim?.trim() ?? null,
        body.engineType?.trim() ?? null,
        body.vin?.trim() ?? null,
        body.plateNumber?.trim() ?? null,
      ]
    );

    return res.json({ message: 'Vehicle updated' });
  } catch (error) {
    return next(error);
  }
});

vehiclesRouter.patch('/:vehicleId/set-default', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { vehicleId } = req.params;
    const owned = await query<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, userId]
    );
    if (!owned.rows[0]) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await query(`UPDATE vehicles SET is_default = FALSE WHERE user_id = $1`, [userId]);
    await query(`UPDATE vehicles SET is_default = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2`, [
      vehicleId,
      userId,
    ]);
    return res.json({ message: 'Default vehicle updated' });
  } catch (error) {
    return next(error);
  }
});

vehiclesRouter.delete('/:vehicleId', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { vehicleId } = req.params;
    const result = await query<{ id: string; is_default: boolean }>(
      `DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING id, is_default`,
      [vehicleId, userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const remaining = await query<{ id: string }>(
      `SELECT id FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (result.rows[0].is_default && remaining.rows[0]) {
      await query(`UPDATE vehicles SET is_default = TRUE, updated_at = NOW() WHERE id = $1`, [
        remaining.rows[0].id,
      ]);
    }

    return res.json({ message: 'Vehicle deleted' });
  } catch (error) {
    return next(error);
  }
});

vehiclesRouter.get('/:vehicleId/history', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const { vehicleId } = req.params;
    const search = ((req.query.search as string | undefined) ?? '').trim();

    const owned = await query<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, userId]
    );

    if (!owned.rows[0]) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const params: unknown[] = [vehicleId];
    let where = 'WHERE h.vehicle_id = $1';

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where +=
        ' AND (LOWER(h.issue_summary) LIKE $2 OR LOWER(h.service_done) LIKE $2 OR LOWER(COALESCE(h.shop_name,\'\')) LIKE $2 OR LOWER(COALESCE(h.status,\'\')) LIKE $2)';
    }

    const history = await query<{
      id: string;
      issue_summary: string;
      service_done: string;
      shop_name: string | null;
      service_date: string;
      status: string;
    }>(
      `
        SELECT h.id, h.issue_summary, h.service_done, h.shop_name, h.service_date::text, h.status
        FROM vehicle_repair_history h
        ${where}
        ORDER BY h.service_date DESC
        LIMIT 50
      `,
      params
    );

    return res.json({
      history: history.rows.map((row) => ({
        id: row.id,
        title: row.service_done,
        subtitle: `${row.issue_summary}${row.shop_name ? ` - ${row.shop_name}` : ''}`,
        date: row.service_date,
        status: row.status,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

vehiclesRouter.post('/upload-rc', async (req, res, next) => {
  try {
    const body = req.body as { rcText?: string };
    const text = body.rcText?.trim();

    if (!text) {
      return res.status(400).json({ message: 'rcText is required' });
    }

    const yearMatch = text.match(/(19|20)\d{2}/);
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    const plateMatch = text.match(/\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}\b/i);

    const makeCandidates = ['BMW', 'Toyota', 'Honda', 'Hyundai', 'Kia', 'Ford', 'Chevrolet'];
    const fuelCandidates = ['Petrol', 'Diesel', 'CNG', 'EV', 'Hybrid'];

    const make = makeCandidates.find((candidate) =>
      text.toLowerCase().includes(candidate.toLowerCase())
    );
    const fuelType = fuelCandidates.find((candidate) =>
      text.toLowerCase().includes(candidate.toLowerCase())
    );

    return res.json({
      suggestion: {
        make: make ?? '',
        model: '',
        year: yearMatch ? Number(yearMatch[0]) : undefined,
        fuelType: fuelType ?? '',
        vin: vinMatch?.[0]?.toUpperCase() ?? '',
        plateNumber: plateMatch?.[0]?.toUpperCase() ?? '',
      },
    });
  } catch (error) {
    return next(error);
  }
});

import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../../db/postgres';
import { requireAuth, requireRole } from '../auth/auth.middleware';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

// Get all users with their roles
adminRouter.get('/users', async (req, res, next) => {
  try {
    const rows = await query<{
      id: string;
      full_name: string;
      email: string | null;
      phone: string;
      is_active: boolean;
      created_at: Date;
      role_code: string;
    }>(
      `
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.phone,
          u.is_active,
          u.created_at,
          r.code as role_code
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN roles r ON r.id = ur.role_id
        ORDER BY u.created_at DESC
      `
    );

    const usersMap = new Map<string, any>();
    
    rows.rows.forEach((row) => {
      if (!usersMap.has(row.id)) {
        usersMap.set(row.id, {
          id: row.id,
          name: row.full_name,
          email: row.email || '',
          phone: row.phone,
          role: row.role_code || 'user',
          status: row.is_active ? 'Active' : 'Suspended',
          joined: row.created_at.toISOString().split('T')[0],
          location: 'Unknown',
        });
      }
    });

    const users = Array.from(usersMap.values());
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

// Suspend/Activate user
adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Suspended'

    const isActive = status === 'Active';

    await query(
      'UPDATE users SET is_active = $1 WHERE id = $2',
      [isActive, id]
    );

    return res.json({ success: true, message: `User ${status.toLowerCase()} successfully` });
  } catch (error) {
    return next(error);
  }
});

// Get all bookings
adminRouter.get('/bookings', async (req, res, next) => {
  try {
    const rows = await query<{
      id: string;
      customer_user_id: string;
      garage_name: string;
      appointment_time: Date;
      status: string;
      created_at: Date;
      full_name: string;
      make: string;
      model: string;
      year: number;
      total_cost: string;
    }>(
      `
        SELECT
          b.id,
          b.customer_user_id,
          g.business_name as garage_name,
          b.appointment_time,
          b.status,
          b.created_at,
          u.full_name,
          v.make,
          v.model,
          v.year,
          q.total_cost::text
        FROM bookings b
        INNER JOIN users u ON u.id = b.customer_user_id
        INNER JOIN garages g ON g.id = b.garage_id
        INNER JOIN quotes q ON q.id = b.quote_id
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        INNER JOIN vehicles v ON v.id = i.vehicle_id
        ORDER BY b.created_at DESC
      `
    );

    const bookings = rows.rows.map((row) => ({
      id: row.id,
      customer: row.full_name,
      vehicle: `${row.year} ${row.make} ${row.model}`,
      garage: row.garage_name,
      service: 'Service',
      date: row.appointment_time.toISOString().split('T')[0],
      time: row.appointment_time.toTimeString().slice(0, 5),
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      amount: `$${Number(row.total_cost).toFixed(2)}`,
      location: 'Unknown',
    }));

    return res.json({ bookings });
  } catch (error) {
    return next(error);
  }
});

// Get all quotes
adminRouter.get('/quotes', async (req, res, next) => {
  try {
    const rows = await query<{
      id: string;
      garage_name: string;
      parts_cost: string;
      labor_cost: string;
      total_cost: string;
      comparison_label: string;
      status: string;
      created_at: Date;
      full_name: string;
      make: string;
      model: string;
      year: number;
    }>(
      `
        SELECT
          q.id,
          g.business_name as garage_name,
          q.parts_cost::text,
          q.labor_cost::text,
          q.total_cost::text,
          q.comparison_label,
          q.status,
          q.created_at,
          u.full_name,
          v.make,
          v.model,
          v.year
        FROM quotes q
        INNER JOIN garages g ON g.id = q.garage_id
        INNER JOIN issue_requests i ON i.id = q.issue_request_id
        INNER JOIN users u ON u.id = i.customer_user_id
        INNER JOIN vehicles v ON v.id = i.vehicle_id
        ORDER BY q.created_at DESC
      `
    );

    const quotes = rows.rows.map((row) => ({
      id: row.id,
      customer: row.full_name,
      vehicle: `${row.year} ${row.make} ${row.model}`,
      garage: row.garage_name,
      service: 'Service',
      amount: `$${Number(row.total_cost).toFixed(2)}`,
      fairPrice: `$${(Number(row.total_cost) * 0.9).toFixed(2)}-$${(Number(row.total_cost) * 1.1).toFixed(2)}`,
      comparison: row.comparison_label === 'fair' ? 'Fair' : row.comparison_label === 'below' ? 'Below Market' : 'Above Market',
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      submitted: row.created_at.toISOString().split('T')[0],
    }));

    return res.json({ quotes });
  } catch (error) {
    return next(error);
  }
});

// Get all payments
adminRouter.get('/payments', async (req, res, next) => {
  try {
    const rows = await query<{
      id: string;
      customer_user_id: string;
      amount: string;
      method: string;
      status: string;
      created_at: Date;
      receipt_number: string | null;
      full_name: string;
      garage_name: string;
    }>(
      `
        SELECT
          p.id,
          p.customer_user_id,
          p.amount::text,
          p.method,
          p.status,
          p.created_at,
          p.receipt_number,
          u.full_name,
          g.business_name as garage_name
        FROM payments p
        INNER JOIN users u ON u.id = p.customer_user_id
        INNER JOIN bookings b ON b.id = p.booking_id
        INNER JOIN garages g ON g.id = b.garage_id
        ORDER BY p.created_at DESC
      `
    );

    const payments = rows.rows.map((row) => ({
      id: row.id,
      customer: row.full_name,
      bookingId: row.receipt_number || 'N/A',
      garage: row.garage_name,
      amount: `$${Number(row.amount).toFixed(2)}`,
      commission: `$${(Number(row.amount) * 0.1).toFixed(2)}`,
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      date: row.created_at.toISOString().split('T')[0],
      method: row.method,
    }));

    return res.json({ payments });
  } catch (error) {
    return next(error);
  }
});

// Get all support tickets (complaints)
adminRouter.get('/complaints', async (req, res, next) => {
  try {
    const rows = await query<{
      id: string;
      customer_user_id: string;
      subject: string;
      description: string;
      status: string;
      created_at: Date;
      full_name: string;
    }>(
      `
        SELECT 
          st.id,
          st.customer_user_id,
          st.subject,
          st.description,
          st.status,
          st.created_at,
          u.full_name
        FROM support_tickets st
        INNER JOIN users u ON u.id = st.customer_user_id
        ORDER BY st.created_at DESC
      `
    );

    const complaints = rows.rows.map((row) => ({
      id: row.id,
      customer: row.full_name,
      garage: 'Unknown',
      type: row.subject,
      description: row.description,
      status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      submitted: row.created_at.toISOString().split('T')[0],
      bookingId: 'N/A',
    }));

    return res.json({ complaints });
  } catch (error) {
    return next(error);
  }
});

// Get pending approvals (garages and vendors)
adminRouter.get('/approvals', async (req, res, next) => {
  try {
    const garageRows = await query<{
      user_id: string;
      full_name: string;
      phone: string;
      city: string | null;
      state: string | null;
      specializations: unknown;
      verification_status: string | null;
      created_at: Date;
    }>(
      `
        SELECT 
          u.id AS user_id,
          u.full_name,
          u.phone,
          g.city,
          g.state,
          g.specializations,
          g.verification_status,
          g.created_at
        FROM garages g
        INNER JOIN users u ON u.id = g.owner_user_id
        WHERE COALESCE(g.is_approved, FALSE) = FALSE
          AND COALESCE(g.verification_status, 'pending') = 'pending'
        ORDER BY g.created_at DESC
      `
    );

    const garages = garageRows.rows.map((row) => {
      const location = [row.city, row.state].filter(Boolean).join(', ') || 'Unknown';
      const normalizedSpecializations = Array.isArray(row.specializations)
        ? (row.specializations as unknown[]).map((value) => String(value))
        : ['General Service'];
      return {
        id: row.user_id,
        name: row.full_name,
        location,
        phone: row.phone,
        specializations: normalizedSpecializations.length > 0 ? normalizedSpecializations : ['General Service'],
        status: row.verification_status ?? 'pending',
        submittedAt: row.created_at.toISOString().split('T')[0],
        documents: ['Business License', 'Insurance'],
      };
    });

    const garageRoleUsersWithoutGarage = await query<{
      user_id: string;
      full_name: string;
      phone: string;
      created_at: Date;
    }>(
      `
        SELECT
          u.id AS user_id,
          u.full_name,
          u.phone,
          u.created_at
        FROM users u
        INNER JOIN user_roles ur ON ur.user_id = u.id
        INNER JOIN roles r ON r.id = ur.role_id AND r.code = 'garage'
        LEFT JOIN garages g ON g.owner_user_id = u.id
        WHERE g.id IS NULL
        ORDER BY u.created_at DESC
      `
    );

    garageRoleUsersWithoutGarage.rows.forEach((row) => {
      garages.push({
        id: row.user_id,
        name: row.full_name,
        location: 'Unknown',
        phone: row.phone,
        specializations: ['General Service'],
        status: 'pending',
        submittedAt: row.created_at.toISOString().split('T')[0],
        documents: ['Business License', 'Insurance'],
      });
    });

    const vendorRows = await query<{
      id: string;
      full_name: string;
      phone: string;
      created_at: Date;
    }>(
      `
        SELECT u.id, u.full_name, u.phone, u.created_at
        FROM users u
        INNER JOIN user_roles ur ON ur.user_id = u.id
        INNER JOIN roles r ON r.id = ur.role_id
        WHERE r.code = 'vendor'
        ORDER BY u.created_at DESC
      `
    );

    const vendors = vendorRows.rows
      .map((row) => ({
        id: row.id,
        name: row.full_name,
        location: 'Unknown',
        phone: row.phone,
        inventory: ['General Parts'],
        status: 'pending',
        submittedAt: row.created_at.toISOString().split('T')[0],
        documents: ['Business License', 'Tax ID'],
      }));

    return res.json({ garages, vendors });
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch('/approvals/garages/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { action } = req.body as { action?: 'approve' | 'reject' };

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ message: 'action must be either approve or reject' });
    }

    const verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    const isApproved = action === 'approve';

    const updatedGarage = await query(
      `
        UPDATE garages
        SET
          verification_status = $1,
          is_approved = $2,
          updated_at = NOW()
        WHERE owner_user_id = $3::uuid
        RETURNING id
      `,
      [verificationStatus, isApproved, userId]
    );

    if (updatedGarage.rows.length === 0) {
      const userRow = await query<{ full_name: string }>(
        `SELECT full_name FROM users WHERE id = $1::uuid LIMIT 1`,
        [userId]
      );
      if (userRow.rows.length === 0) {
        return res.status(404).json({ message: 'Garage user not found' });
      }

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

      await query(
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
            $5::uuid,
            $1::uuid,
            $2,
            'N/A',
            'N/A',
            'N/A',
            'N/A',
            ${specializationsValueSql},
            ${businessHoursValueSql},
            $3,
            $4,
            0
          )
        `,
        [userId, userRow.rows[0].full_name, verificationStatus, isApproved, crypto.randomUUID()]
      );
    }

    return res.json({
      message: action === 'approve' ? 'Garage approved successfully' : 'Garage rejected successfully',
    });
  } catch (error) {
    return next(error);
  }
});

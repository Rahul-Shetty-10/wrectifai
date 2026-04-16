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
          b.garage_name,
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
          q.garage_name,
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
          b.garage_name
        FROM payments p
        INNER JOIN users u ON u.id = p.customer_user_id
        INNER JOIN bookings b ON b.id = p.booking_id
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
    // Get users with garage or vendor role that are not active
    const rows = await query<{
      id: string;
      full_name: string;
      email: string | null;
      phone: string;
      role_code: string;
      created_at: Date;
    }>(
      `
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.phone,
          r.code as role_code,
          u.created_at
        FROM users u
        INNER JOIN user_roles ur ON ur.user_id = u.id
        INNER JOIN roles r ON r.id = ur.role_id
        WHERE r.code IN ('garage', 'vendor')
        ORDER BY u.created_at DESC
      `
    );

    const garages = rows.rows
      .filter((row) => row.role_code === 'garage')
      .map((row) => ({
        id: row.id,
        name: row.full_name,
        location: 'Unknown',
        phone: row.phone,
        specializations: ['General Service'],
        status: 'pending',
        submittedAt: row.created_at.toISOString().split('T')[0],
        documents: ['Business License', 'Insurance'],
      }));

    const vendors = rows.rows
      .filter((row) => row.role_code === 'vendor')
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

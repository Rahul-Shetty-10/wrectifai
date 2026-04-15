import crypto from 'node:crypto';
import { Router } from 'express';
import { query } from '../../db/postgres';
import { requireAuth, requireRole } from '../auth/auth.middleware';

export const diagnosisRouter = Router();

diagnosisRouter.use(requireAuth, requireRole('user'));

diagnosisRouter.post('/sessions', async (req, res, next) => {
  try {
    const userId = req.authUser!.userId;
    const body = req.body as {
      vehicleId?: string;
      symptoms?: string;
      attachments?: string[];
    };

    const vehicleId = body.vehicleId?.trim();
    if (!vehicleId) {
      return res.status(400).json({ message: 'vehicleId is required' });
    }

    const vehicle = await query<{ id: string }>(
      `SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [vehicleId, userId]
    );
    if (!vehicle.rows[0]) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const symptoms = (body.symptoms ?? '').trim();
    const lower = symptoms.toLowerCase();

    let urgency = 'Medium';
    let diyAllowed = false;
    let riskText = 'Performance degradation over time.';
    let issues: Array<{
      issue: string;
      solution: string;
      urgency: 'Low' | 'Medium' | 'High' | 'Critical';
      riskIfIgnored: string;
      requiresGarage: boolean;
      draftQuote: { totalEstimate: string; parts: string[]; laborTime: string };
    }>;

    if (lower.includes('brake') || lower.includes('squeak')) {
      urgency = 'High';
      diyAllowed = false;
      riskText = 'Reduced braking safety and potential rotor damage.';
      issues = [
        {
          issue: 'Worn Brake Pads or Rotor Wear',
          solution:
            'Inspect pad thickness and rotor surface. Replace pads and resurface/replace rotors as needed.',
          urgency: 'High',
          riskIfIgnored: riskText,
          requiresGarage: true,
          draftQuote: {
            totalEstimate: '$250 - $400',
            parts: ['Brake Pads', 'Brake Fluid'],
            laborTime: '1.5 hrs',
          },
        },
      ];
    } else if (lower.includes('battery') || lower.includes('start')) {
      urgency = 'Medium';
      diyAllowed = true;
      riskText = 'Vehicle may fail to start unexpectedly.';
      issues = [
        {
          issue: 'Battery Health Degradation',
          solution: 'Test battery CCA and charging system, replace battery if below threshold.',
          urgency: 'Medium',
          riskIfIgnored: riskText,
          requiresGarage: false,
          draftQuote: {
            totalEstimate: '$120 - $240',
            parts: ['12V Battery'],
            laborTime: '0.5 hrs',
          },
        },
      ];
    } else {
      urgency = 'Medium';
      diyAllowed = false;
      riskText = 'Continued use may increase repair scope and cost.';
      issues = [
        {
          issue: 'General Powertrain Performance Issue',
          solution:
            'Run OBD scan, check wear parts and fluid conditions, then proceed with targeted inspection.',
          urgency: 'Medium',
          riskIfIgnored: riskText,
          requiresGarage: true,
          draftQuote: {
            totalEstimate: '$150 - $320',
            parts: ['Service Kit', 'Fluid Top-up'],
            laborTime: '1.0 hrs',
          },
        },
      ];
    }

    const id = crypto.randomUUID();
    const created = await query<{ created_at: Date }>(
      `
        INSERT INTO diagnosis_sessions (
          id, customer_user_id, vehicle_id, symptoms_text, attachments,
          possible_issues, urgency, diy_allowed, risk_text, next_questions,
          draft_estimate_min, draft_estimate_max, status
        )
        VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10::jsonb,$11,$12,'diagnosis_ready')
        RETURNING created_at
      `,
      [
        id,
        userId,
        vehicleId,
        symptoms || null,
        JSON.stringify(body.attachments ?? []),
        JSON.stringify(issues),
        urgency.toLowerCase(),
        diyAllowed,
        riskText,
        JSON.stringify([]),
        Number(issues[0].draftQuote.totalEstimate.replace(/[^0-9]/g, '').slice(0, 3)) || 100,
        Number(issues[0].draftQuote.totalEstimate.replace(/[^0-9]/g, '').slice(-3)) || 300,
      ]
    );

    return res.status(201).json({
      diagnosisSessionId: id,
      createdAt: created.rows[0]?.created_at,
      diagnoses: issues,
    });
  } catch (error) {
    return next(error);
  }
});

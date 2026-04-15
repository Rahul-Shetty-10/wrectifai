import { Router } from 'express';
import { query } from '../../db/postgres';

export const appConfigRouter = Router();

appConfigRouter.get('/app-identity', async (_req, res, next) => {
  try {
    const result = await query<{ value_json: { name?: string; tagline?: string; logoUrl?: string } }>(
      `
        SELECT value_json
        FROM runtime_app_config
        WHERE key = 'app_identity'
        LIMIT 1
      `
    );

    const value = result.rows[0]?.value_json ?? {};
    return res.json({
      name: value.name ?? 'WrectifAI',
      tagline: value.tagline ?? 'Service. Quotes. Simplified.',
      logoUrl: value.logoUrl ?? '',
    });
  } catch (error) {
    return next(error);
  }
});

import { Router } from 'express';
import { success, error } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { query } from '../../config/database';

export const garagesRouter = Router();

const badgeMap: Record<string, string> = {
  topRated: 'Top Rated',
  budgetFriendly: 'Best Value',
  mostTrusted: 'Most Trusted',
  evSpecialist: 'EV Specialist'
};

function mapGarageDbRow(g: any) {
  return {
    id: g.id,
    name: g.name,
    location: g.address || '',
    rating: g.ratingAvg !== null && g.ratingAvg !== undefined ? Number(g.ratingAvg) : 0,
    reviews: Number(g.ratingCount || 0),
    distance: g.distanceKm || null,
    price: g.startingPrice || null,
    badge: g.badge ? (badgeMap[g.badge] || g.badge) : null,
    image: g.image || null,
    chips: g.specializations || [],
    verified: g.approval_status === 'approved',
    responseMins: g.responseMins !== null && g.responseMins !== undefined ? Number(g.responseMins) : 30,
  };
}

garagesRouter.get('/search', async (req, res) => {
  try {
    const result = await query(
      `SELECT g.id, g.name, g.address, g.specializations, g.approval_status, 
              g.rating_avg as "ratingAvg", g.rating_count as "ratingCount",
              g.starting_price as "startingPrice", g.distance_km as "distanceKm",
              g.image, g.response_mins as "responseMins",
              (SELECT badge_key FROM garage_badges gb WHERE gb.garage_id = g.id AND gb.active = true LIMIT 1) as badge
       FROM garages g
       WHERE g.approval_status IN ('approved', 'pending')`
    );

    const mapped = result.rows.map(mapGarageDbRow);
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

garagesRouter.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT g.id, g.name, g.address, g.specializations, g.approval_status, 
              g.rating_avg as "ratingAvg", g.rating_count as "ratingCount",
              g.starting_price as "startingPrice", g.distance_km as "distanceKm",
              g.image, g.response_mins as "responseMins",
              (SELECT badge_key FROM garage_badges gb WHERE gb.garage_id = g.id AND gb.active = true LIMIT 1) as badge
       FROM garages g
       WHERE g.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return error(res, 'Garage not found', 'NOT_FOUND', 404);
    }
    const mapped = mapGarageDbRow(result.rows[0]);
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

garagesRouter.post('/onboarding', authenticate, (req, res) => {
  return success(
    res,
    {
      id: 'g3',
      ownerUserId: req.user?.userId,
      name: req.body.name,
      address: req.body.address,
      approvalStatus: 'pending',
      createdAt: new Date().toISOString(),
    },
    201
  );
});

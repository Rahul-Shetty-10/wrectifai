import { Router } from 'express';
import { getDashboardData } from '../content/content.service';

export const dashboardRouter = Router();

dashboardRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ data: await getDashboardData() });
  } catch (error) {
    next(error);
  }
});

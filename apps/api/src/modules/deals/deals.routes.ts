import { Router } from 'express';
import { getDealsData } from '../content/content.service';

export const dealsRouter = Router();

dealsRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ data: await getDealsData() });
  } catch (error) {
    next(error);
  }
});

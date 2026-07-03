import { Router } from 'express';
import { getGaragesData } from '../content/content.service';

export const garagesRouter = Router();

garagesRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ data: await getGaragesData() });
  } catch (error) {
    next(error);
  }
});

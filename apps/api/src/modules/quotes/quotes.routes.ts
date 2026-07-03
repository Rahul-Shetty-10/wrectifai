import { Router } from 'express';
import { getQuotesData } from '../content/content.service';

export const quotesRouter = Router();

quotesRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ data: await getQuotesData() });
  } catch (error) {
    next(error);
  }
});

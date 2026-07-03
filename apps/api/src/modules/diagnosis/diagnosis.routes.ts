import { Router } from 'express';
import { getDiagnosisCatalogData } from '../content/content.service';

export const diagnosisRouter = Router();

diagnosisRouter.get('/catalog', async (_req, res, next) => {
  try {
    res.json({ data: await getDiagnosisCatalogData() });
  } catch (error) {
    next(error);
  }
});

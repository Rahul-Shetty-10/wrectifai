import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { dashboardRouter } from '../modules/dashboard/dashboard.routes';
import { dealsRouter } from '../modules/deals/deals.routes';
import { diagnosisRouter } from '../modules/diagnosis/diagnosis.routes';
import { garagesRouter } from '../modules/garages/garages.routes';
import { quotesRouter } from '../modules/quotes/quotes.routes';
import { requireAuth } from '../middleware/require-auth';
import { usersRouter } from '../modules/users/users.routes';
import { getHealthStatus } from '../services/health.service';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json(getHealthStatus());
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', requireAuth, dashboardRouter);
apiRouter.use('/garages', requireAuth, garagesRouter);
apiRouter.use('/deals', requireAuth, dealsRouter);
apiRouter.use('/quotes', requireAuth, quotesRouter);
apiRouter.use('/diagnosis', requireAuth, diagnosisRouter);
apiRouter.use('/users', requireAuth, usersRouter);

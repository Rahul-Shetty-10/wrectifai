import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { adminRouter } from '../modules/admin/admin.routes';
import { appConfigRouter } from '../modules/app-config/app-config.routes';
import { diagnosisRouter } from '../modules/diagnosis/diagnosis.routes';
import { marketplaceRouter } from '../modules/marketplace/marketplace.routes';
import { paymentsRouter } from '../modules/payments/payments.routes';
import { uiContentRouter } from '../modules/ui-content/ui-content.routes';
import { usersRouter } from '../modules/users/users.routes';
import { vehiclesRouter } from '../modules/vehicles/vehicles.routes';
import { getHealthStatus } from '../services/health.service';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json(getHealthStatus());
});

apiRouter.use('/ui-content', uiContentRouter);
apiRouter.use('/app-config', appConfigRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/vehicles', vehiclesRouter);
apiRouter.use('/diagnosis', diagnosisRouter);
apiRouter.use('/marketplace', marketplaceRouter);
apiRouter.use('/payments', paymentsRouter);

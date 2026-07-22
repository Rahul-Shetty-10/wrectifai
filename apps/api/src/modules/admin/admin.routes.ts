import { Router } from 'express';
import { success } from '../../utils/response';
import { authenticate, requireRole } from '../../middleware/auth';

export const adminRouter = Router();

// Apply auth and admin role requirements to all routes in this sub-router
adminRouter.use(authenticate);
adminRouter.use(requireRole(['admin']));

adminRouter.get('/onboarding/garages', (req, res) => {
  return success(res, [
    {
      id: 'g3',
      name: 'Speedy Garage',
      address: '789 Fast Lane',
      approvalStatus: 'pending',
    },
  ]);
});

adminRouter.post('/onboarding/garages/:id/approve', (req, res) => {
  return success(res, {
    garageId: req.params.id,
    approvalStatus: 'approved',
    reviewedBy: req.user?.userId,
    reviewedAt: new Date().toISOString(),
  });
});

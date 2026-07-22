import { Router } from 'express';
import { success, error } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

export const paymentsRouter = Router();

paymentsRouter.post('/intent', authenticate, (req, res) => {
  const { amount, bookingId, orderId } = req.body;
  if (!amount) {
    return error(res, 'Amount is required to create a payment intent', 'BAD_REQUEST', 400);
  }

  return success(
    res,
    {
      id: 'pay_intent_1',
      payerUserId: req.user?.userId,
      bookingId: bookingId || null,
      orderId: orderId || null,
      provider: 'stripe',
      providerIntentId: 'pi_mock_' + Math.random().toString(36).substring(2, 12),
      amount,
      currency: 'USD',
      status: 'created',
      createdAt: new Date().toISOString(),
    },
    201
  );
});

paymentsRouter.post('/confirm', authenticate, (req, res) => {
  const { providerIntentId } = req.body;
  if (!providerIntentId) {
    return error(res, 'Provider Intent ID is required to confirm payment', 'BAD_REQUEST', 400);
  }

  return success(res, {
    providerIntentId,
    status: 'succeeded',
    message: 'Payment confirmed successfully',
  });
});

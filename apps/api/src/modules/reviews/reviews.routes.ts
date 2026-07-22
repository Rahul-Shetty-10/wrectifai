import { Router } from 'express';
import { success, error } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

export const reviewsRouter = Router();

reviewsRouter.post('/', authenticate, (req, res) => {
  const { bookingId, ratingOverall, comment } = req.body;
  if (!bookingId || !ratingOverall) {
    return error(res, 'Booking ID and overall rating are required', 'BAD_REQUEST', 400);
  }

  return success(
    res,
    {
      id: 'rev_1',
      bookingId,
      customerId: req.user?.userId,
      garageId: 'g1',
      ratingOverall,
      comment,
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
    201
  );
});

reviewsRouter.get('/garage/:garageId', (req, res) => {
  return success(res, [
    {
      id: 'rev_mock_1',
      bookingId: 'b1',
      customerId: 'u1',
      garageId: req.params.garageId,
      ratingOverall: 5,
      comment: 'Excellent service! Very professional.',
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
  ]);
});

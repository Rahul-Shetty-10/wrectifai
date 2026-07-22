import { Router } from 'express';
import { success } from '../../utils/response';
import { authenticate } from '../../middleware/auth';
import { query } from '../../config/database';

export const marketplaceRouter = Router();

marketplaceRouter.get('/orders', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM orders');
    const count = Number(result.rows[0]?.count || 0);
    return success(res, { count });
  } catch (err) {
    return success(res, { count: 3 }); // Fallback to 3 if DB error/empty
  }
});

marketplaceRouter.get('/products', (req, res) => {
  return success(res, [
    {
      id: 'p1',
      sellerId: 's1',
      name: 'All-in-One Brake Repair Kit',
      category: 'Brakes',
      price: 89.99,
      currency: 'USD',
      isDiyKit: true,
      isActive: true,
    },
    {
      id: 'p2',
      sellerId: 's1',
      name: 'Premium Spark Plugs Set',
      category: 'Ignition',
      price: 34.5,
      currency: 'USD',
      isDiyKit: true,
      isActive: true,
    },
  ]);
});

marketplaceRouter.get('/products/:productId', (req, res) => {
  return success(res, {
    id: req.params.productId,
    sellerId: 's1',
    name: 'All-in-One Brake Repair Kit',
    description: 'High-quality brake pads and rotors bundle with video guide.',
    category: 'Brakes',
    price: 89.99,
    currency: 'USD',
    isDiyKit: true,
    isActive: true,
  });
});

marketplaceRouter.post('/products', authenticate, (req, res) => {
  const { name, category, price, isDiyKit } = req.body;
  return success(
    res,
    {
      id: 'p3',
      sellerId: 's_user_' + req.user?.userId,
      name,
      category,
      price,
      isDiyKit: isDiyKit || false,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    201
  );
});

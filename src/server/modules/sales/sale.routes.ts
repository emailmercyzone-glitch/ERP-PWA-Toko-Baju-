import { Router } from 'express';

export const saleRoutes = Router();

saleRoutes.post('/', async (req, res) => {
  const body = req.body ?? {};

  res.status(201).json({
    success: true,
    message: 'Sale created',
    data: {
      id: 'sale-1',
      storeId: body.storeId ?? 'store-1',
      total: body.total ?? 0,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
    },
  });
});

saleRoutes.get('/:id', async (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id,
      storeId: 'store-1',
      subtotal: 170000,
      discountAmount: 0,
      total: 170000,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      items: [],
    },
  });
});

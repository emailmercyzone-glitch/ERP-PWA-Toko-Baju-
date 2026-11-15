import { Router } from 'express';

export const stockRoutes = Router();

stockRoutes.get('/:storeId', async (req, res) => {
  const { storeId } = req.params;
  res.json({
    success: true,
    data: {
      storeId,
      items: [
        { variantId: 'v-1', sku: 'BJU-001-S', qty: 12 },
        { variantId: 'v-2', sku: 'BJU-001-M', qty: 7 },
      ],
    },
  });
});

stockRoutes.post('/opname', async (_req, res) => {
  res.json({
    success: true,
    message: 'Stock opname recorded',
    data: {
      id: 'opname-1',
      status: 'POSTED',
    },
  });
});

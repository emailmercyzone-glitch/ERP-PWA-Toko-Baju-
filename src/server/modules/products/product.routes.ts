import { Router } from 'express';

export const productRoutes = Router();

productRoutes.get('/', async (_req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'p-1',
        sku: 'BJU-001',
        name: 'Kaos Polos',
        category: 'Pakaian Pria',
        active: true,
        variants: [
          { id: 'v-1', sku: 'BJU-001-S', barcode: '880001', color: 'Putih', size: 'S', price: 85000 },
          { id: 'v-2', sku: 'BJU-001-M', barcode: '880002', color: 'Putih', size: 'M', price: 85000 },
        ],
      },
    ],
  });
});

productRoutes.get('/search', async (req, res) => {
  const { q } = req.query;
  res.json({
    success: true,
    query: q || '',
    data: [],
  });
});

productRoutes.get('/:id', async (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: { id, sku: 'BJU-001', name: 'Kaos Polos', category: 'Pakaian Pria', active: true },
  });
});

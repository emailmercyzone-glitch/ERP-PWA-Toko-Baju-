import { Router } from 'express';

export const storeRoutes = Router();

storeRoutes.get('/', async (_req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'store-1', code: 'TKO1', name: 'Toko 1', address: 'Jl. Sudirman', active: true },
      { id: 'store-2', code: 'TKO2', name: 'Toko 2', address: 'Jl. Merdeka', active: true },
    ],
  });
});

storeRoutes.get('/:id', async (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: { id, code: 'TKO1', name: 'Toko 1', address: 'Jl. Sudirman', active: true },
  });
});

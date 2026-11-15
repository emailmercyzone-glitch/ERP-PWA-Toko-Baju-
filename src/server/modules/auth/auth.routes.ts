import { Router } from 'express';

export const authRoutes = Router();

authRoutes.post('/login', async (_req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint ready',
    data: {
      user: {
        id: 'demo-user',
        name: 'Owner Demo',
        role: 'OWNER',
        stores: ['store-1', 'store-2'],
      },
      token: 'demo-token',
    },
  });
});

authRoutes.post('/logout', async (_req, res) => {
  res.json({ success: true, message: 'Logout ok' });
});

authRoutes.get('/me', async (_req, res) => {
  res.json({
    success: true,
    data: {
      id: 'demo-user',
      name: 'Owner Demo',
      role: 'OWNER',
      stores: [{ id: 'store-1', name: 'Toko 1' }, { id: 'store-2', name: 'Toko 2' }],
    },
  });
});

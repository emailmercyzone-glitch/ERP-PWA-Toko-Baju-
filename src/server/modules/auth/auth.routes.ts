import { Router } from 'express';
import { getUserById, issueSessionToken, verifyUserPin } from './auth.service';

export const authRoutes = Router();

authRoutes.post('/login', async (req, res) => {
  const { userId, pin } = req.body ?? {};

  if (!userId || !pin || typeof userId !== 'string' || typeof pin !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'userId dan pin wajib diisi.',
    });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'User tidak ditemukan.',
    });
  }

  const isValid = verifyUserPin(userId, pin);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'PIN salah.',
    });
  }

  const token = issueSessionToken(user.id);

  return res.json({
    success: true,
    message: 'Login berhasil',
    data: {
      user,
      token,
      expiresIn: '8h',
    },
  });
});

authRoutes.post('/logout', async (_req, res) => {
  res.json({ success: true, message: 'Logout ok' });
});

authRoutes.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.replace('Bearer ', '');

  if (!token || !token.startsWith('session_')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Token tidak valid.',
    });
  }

  const userId = token.split('_').at(-1);
  const user = userId ? getUserById(userId) : null;

  if (!user) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Sesi tidak valid.',
    });
  }

  return res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      role: user.role,
      stores: user.storeIds.map((id) => ({ id, name: id === 'store-1' ? 'Toko 1' : 'Toko 2' })),
    },
  });
});

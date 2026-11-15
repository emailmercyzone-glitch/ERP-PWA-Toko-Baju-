import { Router } from 'express';
import { getUserById, isDemoAuthEnabled, issueSessionToken, revokeSession, verifyUserPin } from './auth.service';
import { requireAuth } from '../../middleware/requireAuth';

export const authRoutes = Router();

authRoutes.post('/login', (req, res) => {
  if (!isDemoAuthEnabled()) {
    return res.status(503).json({ success: false, code: 'AUTH_NOT_CONFIGURED', message: 'Autentikasi belum dikonfigurasi.' });
  }
  const { userId, pin } = req.body ?? {};
  if (typeof userId !== 'string' || typeof pin !== 'string') {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: 'userId dan pin wajib diisi.' });
  }
  const user = getUserById(userId);
  if (!user || !verifyUserPin(userId, pin)) {
    return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'ID pengguna atau PIN salah.' });
  }
  const token = issueSessionToken(user.id);
  return res.json({ success: true, data: { user, token, expiresIn: 28800 } });
});

authRoutes.post('/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.slice('Bearer '.length);
  if (token) revokeSession(token);
  return res.json({ success: true, message: 'Logout berhasil.' });
});

authRoutes.get('/me', requireAuth, (_req, res) => {
  return res.json({ success: true, data: res.locals.authUser });
});

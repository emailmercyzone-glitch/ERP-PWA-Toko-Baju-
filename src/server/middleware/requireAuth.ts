import type { NextFunction, Request, Response } from 'express';
import { getUserForSession } from '../modules/auth/auth.service';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization ?? '';
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Silakan login kembali.' });
  }
  const token = authorization.slice('Bearer '.length).trim();
  const user = token ? getUserForSession(token) : null;
  if (!user) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Sesi tidak valid atau sudah berakhir.' });
  }
  res.locals.authUser = user;
  return next();
}

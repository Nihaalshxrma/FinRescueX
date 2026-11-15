// FinRescue X — Auth Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findById } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'finrescue-x-demo-secret';

export interface AuthRequest extends Request {
  user?: any;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = findById('users', decoded.userId);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }
    req.user = user;
    next();
  } catch (e) { res.status(403).json({ error: 'Invalid or expired token' }); }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' }); return;
    }
    next();
  };
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

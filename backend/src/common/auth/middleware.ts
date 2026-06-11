import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../../config'
import { User } from '../../database/models'

export interface AuthRequest extends Request {
  user?: { _id: string; name: string; email: string; role: string; organization: string }
}

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiry } as any)
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json(err401())
  }
  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string }
    const user = await User.findById(decoded.id).select('-password')
    if (!user || user.status === 'suspended') return res.status(401).json(err401())
    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
    }
    next()
  } catch {
    return res.status(401).json(err401())
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(errForbidden())
    }
    next()
  }
}

function err401() {
  return {
    data: null,
    meta: { requestId: 'auth', timestamp: new Date().toISOString() },
    error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
  }
}
function errForbidden() {
  return {
    data: null,
    meta: { requestId: 'auth', timestamp: new Date().toISOString() },
    error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
  }
}

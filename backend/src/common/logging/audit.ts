import { AuditEvent } from '../../database/models'
import { AuthRequest } from '../auth/middleware'

export async function logAudit(
  req: AuthRequest,
  action: string,
  target: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await AuditEvent.create({
      actor: {
        _id: req.user?._id,
        name: req.user?.name,
        email: req.user?.email,
      },
      action,
      target,
      targetId,
      metadata,
      ip: req.ip,
      organization: req.user?.organization,
    })
  } catch (e) {
    // audit failure must never break the main flow
    console.error('[AuditLog] Failed to write audit event:', e)
  }
}

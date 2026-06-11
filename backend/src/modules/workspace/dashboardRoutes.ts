import { Router, Response } from 'express'
import { protect, requireRole, AuthRequest } from '../../common/auth/middleware'
import { ok, serverError } from '../../common/errors/response'
import { Meeting, ActionItem, AuditEvent, User } from '../../database/models'

const router = Router()

// GET /api/v1/amms/dashboard
router.get('/dashboard', protect, async (req: AuthRequest, res: Response) => {
  try {
    const org = req.user!.organization
    const userId = req.user!._id

    const [
      totalMeetings,
      transcribed,
      actionItemsPending,
      actionItemsDone,
      recentMeetings,
      recentActions,
    ] = await Promise.all([
      Meeting.countDocuments({ organization: org }),
      Meeting.countDocuments({ organization: org, status: { $in: ['transcribed','summarized','completed'] } }),
      ActionItem.countDocuments({ organization: org, status: 'pending' }),
      ActionItem.countDocuments({ organization: org, status: 'done' }),
      Meeting.find({ organization: org })
        .populate('createdBy', 'name email')
        .sort({ date: -1 })
        .limit(5)
        .lean(),
      ActionItem.find({ organization: org, status: { $ne: 'done' } })
        .populate('assignee', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ])

    const weeklyActiveMeetings = await Meeting.countDocuments({
      organization: org,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })

    return ok(res, {
      totalMeetings,
      transcribed,
      actionItemsPending,
      actionItemsDone,
      weeklyActiveMeetings,
      transcriptionCompletionRate: totalMeetings > 0 ? transcribed / totalMeetings : 0,
      searchSuccessRate: 0.87,
      recentMeetings,
      recentActions,
    })
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /api/v1/amms/admin/audit-events  (org_admin only)
router.get('/admin/audit-events', protect, requireRole('org_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const events = await AuditEvent.find({ organization: req.user!.organization })
      .sort({ createdAt: -1 })
      .limit(100)
    return ok(res, events)
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /api/v1/amms/admin/stats  (org_admin only)
router.get('/admin/stats', protect, requireRole('org_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const org = req.user!.organization
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [totalUsers, totalMeetings, weeklyActive, pendingAudit] = await Promise.all([
      User.countDocuments({ organization: org }),
      Meeting.countDocuments({ organization: org }),
      Meeting.countDocuments({ organization: org, updatedAt: { $gte: oneWeekAgo } }),
      AuditEvent.countDocuments({ organization: org, createdAt: { $gte: oneWeekAgo } }),
    ])

    return ok(res, { totalUsers, totalMeetings, weeklyActive, pendingAudit })
  } catch (err) {
    return serverError(res, err)
  }
})

export default router

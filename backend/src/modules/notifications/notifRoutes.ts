import { Router, Response } from 'express'
import { protect, AuthRequest } from '../../common/auth/middleware'
import { ok, serverError } from '../../common/errors/response'
import { Notification } from '../../database/models'

const router = Router()

// GET /api/v1/amms/notifications
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50)
    return ok(res, notifications)
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /api/v1/amms/notifications/unread-count
router.get('/unread-count', protect, async (req: AuthRequest, res: Response) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user!._id, read: false })
    return ok(res, { count })
  } catch (err) {
    return serverError(res, err)
  }
})

// PATCH /api/v1/amms/notifications/:id
router.patch('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { read: true },
      { new: true }
    )
    return ok(res, notif)
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/v1/amms/notifications/mark-all-read
router.post('/mark-all-read', protect, async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.user!._id, read: false }, { read: true })
    return ok(res, { updated: true })
  } catch (err) {
    return serverError(res, err)
  }
})

export default router

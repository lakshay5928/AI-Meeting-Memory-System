import { Router, Response } from 'express'
import { z } from 'zod'
import { protect, AuthRequest } from '../../common/auth/middleware'
import { ok, created, badRequest, notFound, forbidden, serverError } from '../../common/errors/response'
import { logAudit } from '../../common/logging/audit'
import { ActionItem, User } from '../../database/models'

const router = Router()

// GET /api/v1/amms/action-items
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId, status, priority, page = '1', limit = '20' } = req.query as Record<string, string>
    const filter: any = { organization: req.user!.organization }
    if (meetingId) filter.meetingId = meetingId
    if (status)    filter.status   = status
    if (priority)  filter.priority = priority

    const skip = (Number(page) - 1) * Number(limit)
    const [items, total] = await Promise.all([
      ActionItem.find(filter)
        .populate('assignee', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ActionItem.countDocuments(filter),
    ])
    return ok(res, items, 200, { total })
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/v1/amms/action-items
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    meetingId: z.string().min(1),
    text:      z.string().min(3).max(500).trim(),
    assignee:  z.string().optional(),
    dueDate:   z.string().optional(),
    priority:  z.enum(['low','medium','high']).default('medium'),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), reason: e.message }))
    return badRequest(res, 'Please correct the highlighted fields.', details)
  }

  try {
    const item = await ActionItem.create({
      ...parsed.data,
      source:       'manual',
      organization: req.user!.organization,
      createdBy:    req.user!._id,
      dueDate:      parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    })
    await logAudit(req, 'CREATE_ACTION_ITEM', 'ActionItem', item._id.toString())
    return created(res, item)
  } catch (err) {
    return serverError(res, err)
  }
})

// PATCH /api/v1/amms/action-items/:id
router.patch('/:id', protect, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status:   z.enum(['pending','in_progress','done','cancelled']).optional(),
    priority: z.enum(['low','medium','high']).optional(),
    text:     z.string().min(3).max(500).optional(),
    assignee: z.string().optional(),
    dueDate:  z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid update data.')

  try {
    const item = await ActionItem.findOne({ _id: req.params.id, organization: req.user!.organization })
    if (!item) return notFound(res, 'Action item not found.')

    Object.assign(item, {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : item.dueDate,
    })
    await item.save()
    await logAudit(req, 'UPDATE_ACTION_ITEM', 'ActionItem', item._id.toString(), { status: item.status })
    return ok(res, item)
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/v1/amms/transcriptsegment — re-trigger transcription
router.post('/transcriptsegment', protect, async (req: AuthRequest, res: Response) => {
  const { meetingId } = req.body
  if (!meetingId) return badRequest(res, 'meetingId is required.')

  try {
    const { Meeting } = await import('../../database/models')
    const { transcriptionQueue } = await import('../../jobs/transcriptionWorker')

    const meeting = await Meeting.findOne({ _id: meetingId, organization: req.user!.organization })
    if (!meeting) return notFound(res, 'Meeting not found.')
    if (!meeting.recordingUrl) return badRequest(res, 'No recording uploaded for this meeting.')
    if (!transcriptionQueue) return badRequest(res, 'Transcription service unavailable. Check Redis configuration.')

    meeting.status = 'processing'
    await meeting.save()

    await transcriptionQueue.add('transcribe', {
      meetingId:    meeting._id.toString(),
      recordingUrl: meeting.recordingUrl,
    }, {
      attempts: 3,
      backoff:  { type: 'exponential', delay: 5000 },
    })

    await logAudit(req, 'RETRANSCRIBE', 'Meeting', meetingId)
    return ok(res, { queued: true, status: 'processing' })
  } catch (err) {
    return serverError(res, err)
  }
})

export default router

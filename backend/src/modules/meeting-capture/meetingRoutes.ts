import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'
import { protect, AuthRequest } from '../../common/auth/middleware'
import { ok, created, badRequest, notFound, forbidden, serverError } from '../../common/errors/response'
import { logAudit } from '../../common/logging/audit'
import { Meeting, TranscriptSegment, Summary } from '../../database/models'
import { uploadAudio, deleteFile, isCloudinaryConfigured } from '../../integrations/cloudinary'
import { transcriptionQueue } from '../../jobs/transcriptionWorker'

const router = Router()

// Multer — temp disk storage
const upload = multer({
  dest: path.join(process.cwd(), 'tmp', 'uploads'),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'audio/mp4', 'audio/x-m4a', 'audio/m4a',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/octet-stream', // some OS send this for m4a
    ]
    // Also allow by extension
    const ext = path.extname(file.originalname).toLowerCase()
    const allowedExt = ['.mp3','.wav','.ogg','.mp4','.m4a','.webm','.mov','.flac']
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  },
})

// Create upload temp dir
const tmpDir = path.join(process.cwd(), 'tmp', 'uploads')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

// ─── Zod schemas ─────────────────────────────────────────────
const meetingSchema = z.object({
  title:        z.string().min(3).max(200).trim(),
  description:  z.string().max(1000).optional(),
  date:         z.string().min(1),
  // duration: accept anything, strip 0/falsy → undefined
  duration:     z.preprocess(
    (v) => {
      const n = Number(v)
      return isNaN(n) || n <= 0 ? undefined : n
    },
    z.number().max(480).optional()
  ),
  participants: z.array(z.object({
    name:  z.string().min(1),
    email: z.string().optional(),
    role:  z.string().optional(),
  })).optional(),
})

const updateSchema = z.object({
  title:       z.string().min(3).max(200).trim().optional(),
  description: z.string().max(1000).optional(),
  date:        z.string().optional(),
  duration:    z.preprocess(
    (v) => { const n = Number(v); return isNaN(n) || n <= 0 ? undefined : n },
    z.number().max(480).optional()
  ),
})

// ─── List meetings ───────────────────────────────────────────
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, page = '1', limit = '12' } = req.query as Record<string, string>
    const filter: any = { organization: req.user!.organization }
    if (status) filter.status = status
    if (search) filter.$text = { $search: search }

    const skip = (Number(page) - 1) * Number(limit)
    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .populate('createdBy', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Meeting.countDocuments(filter),
    ])
    return ok(res, meetings, 200, { total, page: Number(page), limit: Number(limit) })
  } catch (err) { return serverError(res, err) }
})

// ─── Create meeting ──────────────────────────────────────────
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  const parsed = meetingSchema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), reason: e.message }))
    return badRequest(res, 'Please correct the highlighted fields.', details)
  }

  try {
    const { duration, ...rest } = parsed.data
    const meetingDoc: any = {
      ...rest,
      date:         new Date(parsed.data.date),
      createdBy:    req.user!._id,
      organization: req.user!.organization,
    }
    // Only set duration if valid positive number
    if (duration && duration > 0) meetingDoc.duration = duration

    const meeting = await Meeting.create(meetingDoc)
    await logAudit(req, 'CREATE_MEETING', 'Meeting', meeting._id.toString(), { title: meeting.title })
    return created(res, meeting)
  } catch (err) { return serverError(res, err) }
})

// ─── Get meeting ─────────────────────────────────────────────
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      organization: req.user!.organization,
    }).populate('createdBy', 'name email')
    if (!meeting) return notFound(res, 'Meeting not found.')
    return ok(res, meeting)
  } catch (err) { return serverError(res, err) }
})

// ─── Update meeting ──────────────────────────────────────────
router.patch('/:id', protect, async (req: AuthRequest, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Invalid update data.')
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, organization: req.user!.organization })
    if (!meeting) return notFound(res, 'Meeting not found.')
    const isOwner = meeting.createdBy.toString() === req.user!._id
    if (!isOwner && req.user!.role !== 'org_admin') return forbidden(res, 'Only creator can edit.')
    const { duration, ...rest } = parsed.data
    Object.assign(meeting, rest)
    if (duration && duration > 0) meeting.duration = duration
    await meeting.save()
    await logAudit(req, 'UPDATE_MEETING', 'Meeting', meeting._id.toString())
    return ok(res, meeting)
  } catch (err) { return serverError(res, err) }
})

// ─── Delete meeting ──────────────────────────────────────────
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, organization: req.user!.organization })
    if (!meeting) return notFound(res, 'Meeting not found.')
    const isOwner = meeting.createdBy.toString() === req.user!._id
    if (!isOwner && req.user!.role !== 'org_admin') return forbidden(res, 'Only creator can delete.')
    if (meeting.recordingPublicId) await deleteFile(meeting.recordingPublicId).catch(() => {})
    await meeting.deleteOne()
    await logAudit(req, 'DELETE_MEETING', 'Meeting', meeting._id.toString(), { title: meeting.title })
    return ok(res, { deleted: true })
  } catch (err) { return serverError(res, err) }
})

// ─── Upload recording ────────────────────────────────────────
router.post('/:id/upload', protect, upload.single('recording'), async (req: AuthRequest, res: Response) => {
  const file = req.file
  if (!file) return badRequest(res, 'No file uploaded. Use MP3, WAV, M4A, MP4, or WebM.')

  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, organization: req.user!.organization })
    if (!meeting) {
      fs.unlinkSync(file.path)
      return notFound(res, 'Meeting not found.')
    }
    const isOwner = meeting.createdBy.toString() === req.user!._id
    if (!isOwner && req.user!.role !== 'org_admin') {
      fs.unlinkSync(file.path)
      return forbidden(res, 'Only the meeting creator can upload recordings.')
    }

    // Rename file to preserve extension (Groq needs it)
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4'
    const newPath = file.path + ext
    fs.renameSync(file.path, newPath)

    // Check Cloudinary
    if (!isCloudinaryConfigured()) {
      fs.unlinkSync(newPath)
      return badRequest(res,
        'File storage not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, ' +
        'and CLOUDINARY_API_SECRET in backend/.env — get free account at cloudinary.com'
      )
    }

    // Upload to Cloudinary
    const { url, publicId, duration: cloudDuration } = await uploadAudio(newPath)
    fs.unlinkSync(newPath)

    // Update meeting
    meeting.recordingUrl      = url
    meeting.recordingPublicId = publicId
    if (cloudDuration && cloudDuration > 0) {
      meeting.duration = Math.max(1, Math.round(cloudDuration / 60))
    }
    meeting.status = 'processing'
    await meeting.save()

    // Queue job
    if (!transcriptionQueue) {
      meeting.status = 'draft'
      await meeting.save()
      return badRequest(res, 'Transcription queue unavailable. Check Redis configuration.')
    }
    await transcriptionQueue.add('transcribe', {
      meetingId:    meeting._id.toString(),
      recordingUrl: url,
    }, {
      attempts: 3,
      backoff:  { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail:     20,
    })

    await logAudit(req, 'UPLOAD_RECORDING', 'Meeting', meeting._id.toString())
    return ok(res, { url, status: 'processing', message: 'Recording uploaded. Transcription queued.' })
  } catch (err: any) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path) } catch {}
    }
    return serverError(res, err)
  }
})

// ─── Get transcript ──────────────────────────────────────────
router.get('/:id/transcript', protect, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, organization: req.user!.organization })
    if (!meeting) return notFound(res, 'Meeting not found.')
    const segments = await TranscriptSegment.find({ meetingId: req.params.id })
      .select('-embedding')
      .sort({ startTime: 1 })
    return ok(res, segments)
  } catch (err) { return serverError(res, err) }
})

// ─── Get summary ─────────────────────────────────────────────
router.get('/:id/summary', protect, async (req: AuthRequest, res: Response) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, organization: req.user!.organization })
    if (!meeting) return notFound(res, 'Meeting not found.')
    const summary = await Summary.findOne({ meetingId: req.params.id })
    if (!summary) return notFound(res, 'Summary not available yet.')
    return ok(res, summary)
  } catch (err) { return serverError(res, err) }
})

// ─── Correct summary ─────────────────────────────────────────
router.patch('/:id/summary', protect, async (req: AuthRequest, res: Response) => {
  const schema = z.object({ content: z.string().min(10).max(10000) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Content required (10–10000 chars).')
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, organization: req.user!.organization })
    if (!meeting) return notFound(res, 'Meeting not found.')
    const summary = await Summary.findOneAndUpdate(
      { meetingId: req.params.id },
      { content: parsed.data.content, reviewedBy: req.user!._id, correctedAt: new Date() },
      { new: true }
    )
    if (!summary) return notFound(res, 'Summary not found.')
    await logAudit(req, 'CORRECT_SUMMARY', 'Summary', summary._id.toString(), { meetingId: req.params.id })
    return ok(res, summary)
  } catch (err) { return serverError(res, err) }
})

export default router

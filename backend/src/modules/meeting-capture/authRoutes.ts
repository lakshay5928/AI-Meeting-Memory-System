import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { User } from '../../database/models'
import { signToken, protect, AuthRequest } from '../../common/auth/middleware'
import { ok, created, badRequest, serverError } from '../../common/errors/response'
import { logAudit } from '../../common/logging/audit'

const router = Router()

const registerSchema = z.object({
  name:         z.string().min(2).max(100).trim(),
  email:        z.string().email().toLowerCase().trim(),
  password:     z.string().min(8).max(128),
  role:         z.enum(['team_member','meeting_owner','workspace_manager','org_admin']),
  organization: z.string().min(2).max(200).trim(),
})

const loginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

// POST /api/v1/amms/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({ field: e.path.join('.'), reason: e.message }))
    return badRequest(res, 'Please correct the highlighted fields.', details)
  }

  try {
    const existing = await User.findOne({ email: parsed.data.email })
    if (existing) {
      return badRequest(res, 'An account with this email already exists.', [
        { field: 'email', reason: 'Email already registered' },
      ])
    }

    const user = await User.create(parsed.data)
    const token = signToken(user._id.toString())

    await logAudit(req as AuthRequest, 'REGISTER', 'User', user._id.toString())

    return created(res, {
      token,
      user: {
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        organization: user.organization,
        createdAt:    user.createdAt,
      },
    })
  } catch (err) {
    return serverError(res, err)
  }
})

// POST /api/v1/amms/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return badRequest(res, 'Email and password are required.')
  }

  try {
    const user = await User.findOne({ email: parsed.data.email }).select('+password')
    if (!user) {
      return badRequest(res, 'Invalid email or password.')
    }

    if (user.status === 'suspended') {
      return badRequest(res, 'Your account has been suspended. Contact your administrator.')
    }

    const match = await user.comparePassword(parsed.data.password)
    if (!match) {
      return badRequest(res, 'Invalid email or password.')
    }

    const token = signToken(user._id.toString())
    await logAudit(req as AuthRequest, 'LOGIN', 'User', user._id.toString())

    return ok(res, {
      token,
      user: {
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        organization: user.organization,
        createdAt:    user.createdAt,
      },
    })
  } catch (err) {
    return serverError(res, err)
  }
})

// GET /api/v1/amms/me
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
    if (!user) return badRequest(res, 'User not found.')
    return ok(res, {
      _id:          user._id,
      name:         user.name,
      email:        user.email,
      role:         user.role,
      organization: user.organization,
      avatar:       user.avatar,
      createdAt:    user.createdAt,
    })
  } catch (err) {
    return serverError(res, err)
  }
})

// PATCH /api/v1/amms/me
router.patch('/me', protect, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name:         z.string().min(2).max(100).trim().optional(),
    organization: z.string().min(2).max(200).trim().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return badRequest(res, 'Invalid profile data.')
  }
  try {
    const user = await User.findByIdAndUpdate(req.user!._id, parsed.data, { new: true })
    if (!user) return badRequest(res, 'User not found.')
    await logAudit(req, 'UPDATE_PROFILE', 'User', user._id.toString())
    return ok(res, { _id: user._id, name: user.name, email: user.email, role: user.role, organization: user.organization })
  } catch (err) {
    return serverError(res, err)
  }
})

export default router

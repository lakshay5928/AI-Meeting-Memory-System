import { Response } from 'express'
import { v4 as uuid } from 'uuid'

function meta(extra?: object) {
  return { requestId: uuid(), timestamp: new Date().toISOString(), ...extra }
}

export function ok<T>(res: Response, data: T, status = 200, extra?: object) {
  return res.status(status).json({ data, meta: meta(extra), error: null })
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201)
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function badRequest(res: Response, message: string, details?: any[]) {
  return res.status(400).json({
    data: null,
    meta: meta(),
    error: { code: 'VALIDATION_ERROR', message, details },
  })
}

export function notFound(res: Response, message = 'Resource not found.') {
  return res.status(404).json({
    data: null,
    meta: meta(),
    error: { code: 'NOT_FOUND', message },
  })
}

export function forbidden(res: Response, message = 'Permission denied.') {
  return res.status(403).json({
    data: null,
    meta: meta(),
    error: { code: 'FORBIDDEN', message },
  })
}

export function conflict(res: Response, message: string) {
  return res.status(409).json({
    data: null,
    meta: meta(),
    error: { code: 'CONFLICT', message },
  })
}

export function serverError(res: Response, err: unknown) {
  console.error('[ServerError]', err)
  return res.status(500).json({
    data: null,
    meta: meta(),
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.' },
  })
}

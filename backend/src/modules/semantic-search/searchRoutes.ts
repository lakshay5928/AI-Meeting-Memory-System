import { Router, Response } from 'express'
import { protect, AuthRequest } from '../../common/auth/middleware'
import { ok, badRequest, serverError } from '../../common/errors/response'
import { TranscriptSegment, Meeting, Summary, ActionItem } from '../../database/models'
import { getEmbedding, cosineSimilarity } from '../../integrations/openai'

const router = Router()

// GET /api/v1/amms/semantic-search?q=...
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string || '').trim()
  if (!q || q.length < 3) return badRequest(res, 'Query must be at least 3 characters.')

  try {
    const organization = req.user!.organization

    // Get all meetings for this org
    const meetings = await Meeting.find({ organization }).select('_id title date').lean()
    const meetingIds = meetings.map((m) => m._id.toString())
    const meetingMap = Object.fromEntries(meetings.map((m) => [m._id.toString(), m]))

    const results: any[] = []

    // Strategy 1: Keyword search via MongoDB text index (fast, no API cost)
    const keywordMeetings = await Meeting.find({
      organization,
      $text: { $search: q },
    }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .lean()

    for (const m of keywordMeetings) {
      results.push({
        meetingId:    m._id.toString(),
        meetingTitle: m.title,
        date:         m.date,
        snippet:      m.description || m.title,
        score:        0.7,
        type:         'summary',
      })
    }

    // Strategy 2: Semantic embedding search (if OpenAI key available)
    if (process.env.OPENAI_API_KEY) {
      try {
        const queryEmbedding = await getEmbedding(q)

        // Search transcript segments
        const segments = await TranscriptSegment.find({
          meetingId: { $in: meetingIds },
        }).select('meetingId text speaker startTime embedding').lean() as any[]

        const semanticMatches: any[] = []
        for (const seg of segments) {
          if (!seg.embedding?.length) continue
          const score = cosineSimilarity(queryEmbedding, seg.embedding)
          if (score > 0.75) {
            semanticMatches.push({ seg, score })
          }
        }

        semanticMatches.sort((a, b) => b.score - a.score)

        for (const { seg, score } of semanticMatches.slice(0, 8)) {
          const meeting = meetingMap[seg.meetingId.toString()]
          if (!meeting) continue
          results.push({
            meetingId:    meeting._id.toString(),
            meetingTitle: meeting.title,
            date:         meeting.date,
            snippet:      seg.text,
            score,
            type:         'transcript',
          })
        }
      } catch (embeddingErr) {
        // Embedding failure is non-fatal — keyword results still returned
        console.warn('[Search] Embedding search failed, using keyword only:', embeddingErr)
      }
    }

    // Deduplicate and sort
    const seen = new Set<string>()
    const deduped = results
      .filter((r) => {
        const key = `${r.meetingId}-${r.type}-${r.snippet.slice(0, 40)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)

    return ok(res, deduped)
  } catch (err) {
    return serverError(res, err)
  }
})

export default router

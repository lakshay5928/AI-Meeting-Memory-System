import { Queue, Worker, Job } from 'bullmq'
import { config } from '../config'
import { Meeting, TranscriptSegment, Summary, ActionItem, User } from '../database/models'
import { transcribeAudio, generateSummary, getEmbedding } from '../integrations/openai'
import { createNotification } from '../modules/notifications/service'
import fs from 'fs'
import path from 'path'
import https from 'https'

const connection = {
  url: config.redis.url,
  maxRetriesPerRequest: null as any,
  enableOfflineQueue: false,
  lazyConnect: true,
}

// ─── Queue definition ────────────────────────────────────────
export let transcriptionQueue: InstanceType<typeof Queue> | null = null
transcriptionQueue = new Queue('transcription', {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
}) as InstanceType<typeof Queue>

// ─── Worker ──────────────────────────────────────────────────
export function startWorker() {
  const worker = new Worker('transcription', processJob, {
    connection,
    concurrency: 2,
    limiter: { max: 5, duration: 60_000 },
  })

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} (${job.name}) completed`)
  })
  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
  })

  console.log('🔄 Transcription worker started')
  return worker
}

// ─── Job processor ───────────────────────────────────────────
async function processJob(job: Job) {
  const { meetingId, recordingUrl } = job.data

  const meeting = await Meeting.findById(meetingId)
  if (!meeting) throw new Error(`Meeting ${meetingId} not found`)

  // Update status to processing
  meeting.status = 'processing'
  await meeting.save()

  try {
    await job.updateProgress(10)

    // 1. Download recording to temp file
    const tmpPath = path.join('/tmp', `amms-${meetingId}-${Date.now()}.mp3`)
    await downloadFile(recordingUrl, tmpPath)
    await job.updateProgress(20)

    // 2. Transcribe via Whisper
    const transcript = await transcribeAudio(tmpPath)
    await job.updateProgress(50)

    // 3. Save segments
    const segmentDocs = transcript.segments.map((seg) => ({
      meetingId,
      speaker:    seg.speaker,
      text:       seg.text,
      startTime:  seg.start,
      endTime:    seg.end,
      confidence: seg.confidence,
    }))
    const savedSegments = await TranscriptSegment.insertMany(segmentDocs)

    meeting.status = 'transcribed'
    await meeting.save()
    await job.updateProgress(60)

    // 4. Generate summary
    const participantNames = meeting.participants?.map((p) => p.name) || []
    const summaryResult = await generateSummary(transcript.fullText, participantNames)
    await job.updateProgress(80)

    // 5. Save summary
    const savedSummary = await Summary.create({
      meetingId,
      content:   summaryResult.content,
      keyPoints: summaryResult.keyPoints,
      decisions: summaryResult.decisions,
      aiModel:   'llama-3.1-8b-instant',
      aiVersion: '1',
    })

    meeting.summaryId    = savedSummary._id as any
    meeting.transcriptId = savedSegments[0]?._id as any
    meeting.status = 'summarized'
    await meeting.save()

    // 6. Save action items
    if (summaryResult.actionItems.length > 0) {
      const actions = summaryResult.actionItems.map((a) => ({
        meetingId,
        text:     a.text,
        priority: a.priority || 'medium',
        dueDate:  a.dueDate ? new Date(a.dueDate) : undefined,
        source:   'ai',
        organization: meeting.organization,
      }))
      await ActionItem.insertMany(actions)
    }

    // 7. Generate embeddings for semantic search (background, non-blocking)
    setImmediate(async () => {
      try {
        for (const seg of segmentDocs) {
          const embedding = await getEmbedding(seg.text)
          await TranscriptSegment.findOneAndUpdate(
            { meetingId, startTime: seg.startTime },
            { embedding },
          )
        }
      } catch (e) {
        console.warn('[Embeddings] Failed to generate embeddings:', e)
      }
    })

    meeting.status = 'completed'
    await meeting.save()
    await job.updateProgress(100)

    // 8. Notify meeting creator
    await createNotification({
      userId:  meeting.createdBy.toString(),
      type:    'transcription_complete',
      title:   'Meeting transcribed ✅',
      message: `"${meeting.title}" has been transcribed and summarized.`,
      link:    `/meetings/${meetingId}`,
    })

    // Cleanup temp file
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)

  } catch (err) {
    console.error(`[Worker] Processing failed for meeting ${meetingId}:`, err)
    await Meeting.findByIdAndUpdate(meetingId, { status: 'failed' })

    // Notify creator of failure
    await createNotification({
      userId:  meeting.createdBy.toString(),
      type:    'transcription_failed',
      title:   'Transcription failed',
      message: `We could not process "${meeting.title}". Please try uploading again.`,
      link:    `/meetings/${meetingId}`,
    })

    throw err
  }
}

// ─── Download helper ─────────────────────────────────────────
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

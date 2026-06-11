/**
 * AI Integration — Groq FREE API
 * Whisper-large-v3 for transcription + LLaMA for summary
 * Get free key: https://console.groq.com → API Keys
 */

import fs from 'fs'
import path from 'path'
import { config } from '../config'

// ─── Groq JSON endpoint helper ───────────────────────────────
async function groqChat(body: object): Promise<any> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Groq chat error ${res.status}: ${txt}`)
  }
  return res.json()
}

// ─── Groq Whisper — multipart upload using Node http ─────────
async function groqWhisper(filePath: string): Promise<any> {
  // Build multipart manually — avoids form-data package issues on Windows
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)
  const fileBuffer = fs.readFileSync(filePath)
  const fileName = path.basename(filePath)

  // Determine content type
  const ext = path.extname(filePath).toLowerCase()
  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'video/webm',
    '.flac': 'audio/flac',
  }
  const mimeType = mimeMap[ext] || 'audio/mpeg'

  // Build multipart body
  const parts: Buffer[] = []

  // model field
  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n`
  ))

  // response_format field
  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n`
  ))

  // timestamp_granularities field
  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\nsegment\r\n`
  ))

  // file field
  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  ))
  parts.push(fileBuffer)
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`))

  const body = Buffer.concat(parts)

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length.toString(),
    },
    body,
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Groq Whisper error ${res.status}: ${txt}`)
  }
  return res.json()
}

// ─── Transcription ────────────────────────────────────────────
export interface TranscriptResult {
  segments: Array<{
    speaker: string
    text: string
    start: number
    end: number
    confidence: number
  }>
  fullText: string
}

export async function transcribeAudio(filePath: string): Promise<TranscriptResult> {
  const data = await groqWhisper(filePath)

  if (!data.segments?.length) {
    return {
      fullText: data.text || '',
      segments: [{
        speaker: 'Speaker 1',
        text: data.text || '',
        start: 0,
        end: data.duration || 60,
        confidence: 1,
      }],
    }
  }

  // Naive speaker alternation based on pauses
  const segments = data.segments.map((seg: any, i: number) => {
    const prevEnd = i > 0 ? data.segments[i - 1].end : 0
    const gap = seg.start - prevEnd
    let speakerNum: number
    if (i === 0) speakerNum = 1
    else if (gap > 1.5) speakerNum = i % 2 === 0 ? 1 : 2
    else speakerNum = data.segments[i - 1]._spk || 1
    seg._spk = speakerNum
    return {
      speaker: `Speaker ${speakerNum}`,
      text: (seg.text || '').trim(),
      start: seg.start,
      end: seg.end,
      confidence: seg.no_speech_prob != null ? Math.max(0, 1 - seg.no_speech_prob) : 0.95,
    }
  })

  return { segments, fullText: data.text || '' }
}

// ─── Summary via LLaMA ────────────────────────────────────────
export interface SummaryResult {
  content: string
  keyPoints: string[]
  decisions: string[]
  actionItems: Array<{
    text: string
    assignee?: string
    priority: 'low' | 'medium' | 'high'
    dueDate?: string
  }>
}

export async function generateSummary(
  transcript: string,
  participants: string[],
): Promise<SummaryResult> {
  const participantList = participants.length ? participants.join(', ') : 'Unknown'
  const truncated = transcript.slice(0, 8000)

  const data = await groqChat({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'You are a meeting analyst. Respond ONLY with valid JSON. No markdown, no explanation.',
      },
      {
        role: 'user',
        content: `Analyze this meeting transcript. Participants: ${participantList}

Transcript:
${truncated}

Return ONLY this JSON (no markdown):
{
  "content": "2-3 paragraph prose summary",
  "keyPoints": ["key point 1", "key point 2"],
  "decisions": ["decision 1"],
  "actionItems": [
    { "text": "action", "assignee": "name or null", "priority": "high", "dueDate": "YYYY-MM-DD or null" }
  ]
}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  })

  const raw = (data.choices?.[0]?.message?.content || '{}')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  let parsed: any = {}
  try { parsed = JSON.parse(raw) } catch {
    console.warn('[AI] JSON parse failed, raw:', raw.slice(0, 100))
  }

  return {
    content:     typeof parsed.content === 'string' ? parsed.content : 'Summary unavailable.',
    keyPoints:   Array.isArray(parsed.keyPoints)   ? parsed.keyPoints.filter((x: any) => typeof x === 'string') : [],
    decisions:   Array.isArray(parsed.decisions)   ? parsed.decisions.filter((x: any) => typeof x === 'string') : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.filter((x: any) => typeof x?.text === 'string') : [],
  }
}

// ─── Embeddings (not available on Groq — keyword search used) ─
export function getEmbedding(_text: string): Promise<number[]> {
  return Promise.resolve([])
}
export function cosineSimilarity(_a: number[], _b: number[]): number {
  return 0
}

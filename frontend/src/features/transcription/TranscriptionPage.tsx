import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Mic, Clock } from 'lucide-react'
import api from '@/lib/http/client'
import type { TranscriptSegment } from '@/types'

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const SPEAKER_COLORS = [
  'text-blue-400', 'text-green-400', 'text-purple-400',
  'text-amber-400', 'text-pink-400', 'text-teal-400',
]

export default function TranscriptionPage() {
  const { id } = useParams<{ id: string }>()

  const { data: segments = [], isLoading } = useQuery<TranscriptSegment[]>({
    queryKey: ['transcript', id],
    queryFn: () => api.get(`/meeting/${id}/transcript`).then((r) => r.data.data),
    enabled: !!id,
  })

  const speakers = [...new Set(segments.map((s) => s.speaker))]
  const speakerColor = (speaker: string) =>
    SPEAKER_COLORS[speakers.indexOf(speaker) % SPEAKER_COLORS.length]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/meetings/${id}`} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-header">Transcript</h1>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <Mic size={12} /> {segments.length} segments
          </p>
        </div>
      </div>

      {/* Speaker legend */}
      {speakers.length > 0 && (
        <div className="card p-4 mb-5 flex flex-wrap gap-3">
          {speakers.map((sp) => (
            <div key={sp} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${speakerColor(sp).replace('text-', 'bg-')}`} />
              <span className={`text-sm font-medium ${speakerColor(sp)}`}>{sp}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : !segments.length ? (
        <div className="text-center py-24">
          <Mic size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">No transcript available yet.</p>
          <p className="text-gray-600 text-sm mt-1">Upload a recording to generate a transcript.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((seg) => (
            <div key={seg._id} className="card flex gap-4 items-start">
              <div className="flex-shrink-0 text-right min-w-[60px]">
                <span className={`text-xs font-medium ${speakerColor(seg.speaker)}`}>
                  {seg.speakerLabel || seg.speaker}
                </span>
                <div className="flex items-center gap-1 text-gray-600 text-xs mt-1 justify-end">
                  <Clock size={10} /> {formatTime(seg.startTime)}
                </div>
              </div>
              <div className="flex-1">
                <p className="prose-dark">{seg.text}</p>
                {seg.confidence < 0.8 && (
                  <span className="badge badge-amber mt-1">
                    Low confidence ({Math.round(seg.confidence * 100)}%)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

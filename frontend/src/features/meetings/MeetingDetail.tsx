import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, CheckSquare, Mic, Users, Clock, Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/lib/http/client'
import type { Meeting } from '@/types'
import { statusBadge } from '@/components/ui/badges'

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: meeting, isLoading } = useQuery<Meeting>({
    queryKey: ['meeting', id],
    queryFn: () => api.get(`/meeting/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  const retranscribe = useMutation({
    mutationFn: () => api.post(`/transcriptsegment`, { meetingId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting', id] })
      toast.success('Transcription job queued!')
    },
  })

  const deleteMeeting = useMutation({
    mutationFn: () => api.delete(`/meeting/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting deleted.')
      navigate('/meetings')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton rounded-lg" />
        <div className="h-40 skeleton rounded-2xl" />
        <div className="h-60 skeleton rounded-2xl" />
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400">Meeting not found.</p>
        <Link to="/meetings" className="btn-secondary mt-4 inline-flex">Back to Meetings</Link>
      </div>
    )
  }

  const tabs = [
    { label: 'Transcript', icon: Mic, href: `/meetings/${id}/transcript`, available: !!meeting.transcriptId },
    { label: 'Summary',    icon: FileText, href: `/meetings/${id}/summary`, available: !!meeting.summaryId },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-header truncate">{meeting.title}</h1>
            <span className={statusBadge(meeting.status)}>{meeting.status}</span>
          </div>
          <p className="text-gray-500 text-sm flex items-center gap-2 mt-0.5">
            <Clock size={12} /> {format(new Date(meeting.date), 'MMMM d, yyyy · h:mm a')}
            {meeting.duration && <span>· {meeting.duration} min</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meeting.recordingUrl && (
            <button onClick={() => retranscribe.mutate()}
              disabled={retranscribe.isPending || meeting.status === 'processing'}
              className="btn-ghost text-xs">
              <RefreshCw size={14} className={retranscribe.isPending ? 'animate-spin' : ''} />
              Re-transcribe
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Delete this meeting? This cannot be undone.')) deleteMeeting.mutate()
            }}
            className="btn-ghost text-red-400 hover:text-red-300 text-xs">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="card p-5 mb-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Created by</p>
            <p className="text-sm text-white">{meeting.createdBy?.name}</p>
          </div>
          {meeting.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-300">{meeting.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      {meeting.participants?.length > 0 && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-gray-400" />
            <h2 className="section-title mb-0">Participants ({meeting.participants.length})</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {meeting.participants.map((p) => (
              <div key={p._id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8">
                <div className="w-6 h-6 rounded-full bg-brand-600/30 flex items-center justify-center text-xs text-brand-300 font-medium">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-white">{p.name}</p>
                  {p.role && <p className="text-xs text-gray-500">{p.role}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status processing notice */}
      {meeting.status === 'processing' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-brand-500/20 bg-brand-600/5 p-4 mb-5 flex items-center gap-3"
        >
          <span className="spinner" />
          <div>
            <p className="text-sm text-white font-medium">Transcription in progress</p>
            <p className="text-xs text-gray-500">This usually takes 1–5 minutes. Refresh to check status.</p>
          </div>
        </motion.div>
      )}

      {/* Action tabs */}
      <div className="grid sm:grid-cols-3 gap-4">
        {tabs.map(({ label, icon: Icon, href, available }) => (
          <Link key={label} to={available ? href : '#'}
            className={`card-hover text-center py-6 ${!available ? 'opacity-40 pointer-events-none' : ''}`}>
            <Icon size={24} className="text-brand-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{available ? 'View' : 'Not ready yet'}</p>
          </Link>
        ))}
        <Link to={`/actions?meetingId=${id}`} className="card-hover text-center py-6">
          <CheckSquare size={24} className="text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-white">Action Items</p>
          <p className="text-xs text-gray-500 mt-1">View all</p>
        </Link>
      </div>
    </div>
  )
}

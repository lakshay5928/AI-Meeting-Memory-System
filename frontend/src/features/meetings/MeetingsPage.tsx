import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Video, Search, Filter, Clock, Users } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/http/client'
import type { Meeting } from '@/types'
import { statusBadge } from '@/components/ui/badges'

type Status = 'all' | 'draft' | 'processing' | 'transcribed' | 'summarized' | 'completed' | 'failed'

export default function MeetingsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', search, status, page],
    queryFn: () =>
      api.get('/meeting', { params: { search, status: status === 'all' ? undefined : status, page, limit: 12 } })
         .then((r) => r.data),
  })

  const meetings: Meeting[] = data?.data ?? []
  const total: number = data?.meta?.total ?? 0

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-header">Meetings</h1>
          <p className="text-gray-500 text-sm">{total} total meetings</p>
        </div>
        <Link to="/meetings/new" className="btn-primary">
          <Plus size={16} /> New Meeting
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search meetings..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as Status); setPage(1) }}
          className="input-field w-auto min-w-[140px]"
        >
          {['all','draft','processing','transcribed','summarized','completed','failed'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 skeleton rounded-2xl" />
          ))}
        </div>
      ) : !meetings.length ? (
        <div className="text-center py-24">
          <Video size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium">No meetings found</p>
          <p className="text-gray-600 text-sm mt-1">
            {search ? 'Try a different search term' : 'Create your first meeting to get started'}
          </p>
          {!search && (
            <Link to="/meetings/new" className="btn-primary mt-6 inline-flex">
              <Plus size={16} /> Create Meeting
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((m, i) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/meetings/${m._id}`} className="card-hover block h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                    <Video size={18} className="text-brand-400" />
                  </div>
                  <span className={statusBadge(m.status)}>{m.status}</span>
                </div>
                <h3 className="font-semibold text-white mb-1 line-clamp-2">{m.title}</h3>
                {m.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{m.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-auto pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {format(new Date(m.date), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {m.participants?.length ?? 0}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-ghost disabled:opacity-40">Previous</button>
          <span className="flex items-center px-4 text-sm text-gray-400">
            Page {page} of {Math.ceil(total / 12)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)}
            className="btn-ghost disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}

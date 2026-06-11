import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckSquare, Circle, Clock, User, Plus, Filter } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/lib/http/client'
import type { ActionItem } from '@/types'
import { priorityBadge, actionStatusBadge } from '@/components/ui/badges'

export default function ActionsPage() {
  const [params] = useSearchParams()
  const meetingId = params.get('meetingId')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['actions', meetingId, statusFilter, priorityFilter],
    queryFn: () =>
      api.get('/action-items', {
        params: {
          meetingId: meetingId || undefined,
          status:   statusFilter   === 'all' ? undefined : statusFilter,
          priority: priorityFilter === 'all' ? undefined : priorityFilter,
        },
      }).then((r) => r.data),
  })

  const actions: ActionItem[] = data?.data ?? []

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/action-items/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['actions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleToggle = (action: ActionItem) => {
    const next = action.status === 'done' ? 'pending' : 'done'
    toggleStatus.mutate({ id: action._id, status: next })
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-header">Action Items</h1>
          <p className="text-gray-500 text-sm">{actions.length} items{meetingId ? ' for this meeting' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto min-w-[130px]">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-field w-auto min-w-[130px]">
          <option value="all">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : !actions.length ? (
        <div className="text-center py-24">
          <CheckSquare size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">No action items found</p>
          <p className="text-gray-600 text-sm mt-1">Action items are extracted automatically from meeting summaries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((a, i) => (
            <motion.div
              key={a._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`card flex items-start gap-4 ${a.status === 'done' ? 'opacity-60' : ''}`}
            >
              <button
                onClick={() => handleToggle(a)}
                className="flex-shrink-0 mt-0.5 transition-colors hover:scale-110"
              >
                {a.status === 'done' ? (
                  <CheckSquare size={20} className="text-green-400" />
                ) : (
                  <Circle size={20} className="text-gray-600 hover:text-brand-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm text-white ${a.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                  {a.text}
                </p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {a.assignee && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <User size={11} /> {a.assignee.name}
                    </span>
                  )}
                  {a.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={11} /> {format(new Date(a.dueDate), 'MMM d')}
                    </span>
                  )}
                  <span className="text-xs text-gray-600">
                    {a.source === 'ai' ? '🤖 AI extracted' : '✍️ Manual'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={priorityBadge(a.priority)}>{a.priority}</span>
                <span className={actionStatusBadge(a.status)}>{a.status.replace('_', ' ')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

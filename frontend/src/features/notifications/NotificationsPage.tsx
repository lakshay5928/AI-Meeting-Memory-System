import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/lib/http/client'
import type { Notification } from '@/types'

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications-unread'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data.data.count),
    refetchInterval: 30_000,
  })
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data),
  })

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
      toast.success('All marked as read')
    },
  })

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}`, { read: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const unread = data?.filter((n) => !n.read).length ?? 0

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-header">Notifications</h1>
          <p className="text-gray-500 text-sm">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="btn-ghost text-xs">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="text-center py-24">
          <Bell size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => !n.read && markOne.mutate(n._id)}
              className={`card cursor-pointer flex gap-4 items-start transition-all
                ${n.read ? 'opacity-60' : 'border-brand-500/20 bg-brand-600/5'}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-gray-700' : 'bg-brand-400'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-700 mt-1">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</p>
              </div>
              {n.link && (
                <Link to={n.link} className="flex-shrink-0 text-gray-600 hover:text-brand-400 transition-colors">
                  <ExternalLink size={14} />
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

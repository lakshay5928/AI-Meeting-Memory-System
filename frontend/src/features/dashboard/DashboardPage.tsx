import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Video, CheckSquare, TrendingUp, Clock, ArrowRight, Plus, Zap } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/http/client'
import { useAuthStore } from '@/lib/auth/store'
import type { DashboardStats } from '@/types'
import { statusBadge, priorityBadge } from '@/components/ui/badges'

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-3xl font-display tracking-wide text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

function SkeletonCard() {
  return <div className="card h-32 skeleton" />
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
  })

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="page-header">
            {greet()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm">Here's what's happening with your meetings.</p>
        </div>
        <Link to="/meetings/new" className="btn-primary">
          <Plus size={16} /> New Meeting
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Video} label="Total Meetings" value={data?.totalMeetings ?? 0}
              color="bg-blue-500/15 text-blue-400" />
            <StatCard icon={Zap} label="Transcribed" value={data?.transcribed ?? 0}
              sub={`${Math.round((data?.transcriptionCompletionRate ?? 0) * 100)}% completion rate`}
              color="bg-brand-500/15 text-brand-400" />
            <StatCard icon={CheckSquare} label="Actions Pending" value={data?.actionItemsPending ?? 0}
              color="bg-amber-500/15 text-amber-400" />
            <StatCard icon={TrendingUp} label="Actions Done" value={data?.actionItemsDone ?? 0}
              color="bg-green-500/15 text-green-400" />
          </>
        )}
      </div>

      {/* Recent meetings + Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Meetings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Meetings</h2>
            <Link to="/meetings" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-xl" />
              ))}
            </div>
          ) : !data?.recentMeetings?.length ? (
            <div className="text-center py-10">
              <Video size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No meetings yet</p>
              <Link to="/meetings/new" className="btn-primary mt-4 inline-flex">
                <Plus size={14} /> Create Meeting
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentMeetings.map((m) => (
                <Link key={m._id} to={`/meetings/${m._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                    <Video size={16} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-brand-300 transition-colors">
                      {m.title}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={10} /> {format(new Date(m.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={statusBadge(m.status)}>{m.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Action Items</h2>
            <Link to="/actions" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-xl" />
              ))}
            </div>
          ) : !data?.recentActions?.length ? (
            <div className="text-center py-10">
              <CheckSquare size={32} className="text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No action items yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentActions.map((a) => (
                <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    a.priority === 'high' ? 'bg-red-400' :
                    a.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-1">{a.text}</p>
                    <p className="text-xs text-gray-500">{a.assignee?.name || 'Unassigned'}</p>
                  </div>
                  <span className={priorityBadge(a.priority)}>{a.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

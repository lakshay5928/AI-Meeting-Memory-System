import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Shield, Users, Video, Clock, Activity } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/http/client'
import type { AuditEvent } from '@/types'

export default function AdminPage() {
  const { data: audit, isLoading } = useQuery<AuditEvent[]>({
    queryKey: ['audit'],
    queryFn: () => api.get('/admin/audit-events').then((r) => r.data.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Shield size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="page-header">Admin Console</h1>
          <p className="text-gray-500 text-sm">Organization management and audit history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Total Users', value: stats?.totalUsers ?? '—', color: 'bg-blue-500/15 text-blue-400' },
          { icon: Video, label: 'Total Meetings', value: stats?.totalMeetings ?? '—', color: 'bg-brand-500/15 text-brand-400' },
          { icon: Activity, label: 'Active This Week', value: stats?.weeklyActive ?? '—', color: 'bg-green-500/15 text-green-400' },
          { icon: Clock, label: 'Pending Audit', value: stats?.pendingAudit ?? '—', color: 'bg-amber-500/15 text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div key={label} whileHover={{ y: -2 }} className="card">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-display text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Audit log */}
      <div className="card p-5">
        <h2 className="section-title">Audit Trail</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
          </div>
        ) : !audit?.length ? (
          <p className="text-center text-gray-500 py-8 text-sm">No audit events yet</p>
        ) : (
          <div className="space-y-1">
            {audit.map((e) => (
              <div key={e._id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-sm">
                <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center flex-shrink-0 text-xs text-gray-400 font-medium">
                  {e.actor?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white">{e.actor?.name}</span>
                  {' '}
                  <span className="text-gray-400">{e.action}</span>
                  {' '}
                  <span className="text-brand-400">{e.target}</span>
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0">
                  {format(new Date(e.createdAt), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

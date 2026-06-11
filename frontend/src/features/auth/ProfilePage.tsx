import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/http/client'
import { useAuthStore } from '@/lib/auth/store'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organization: z.string().min(2, 'Organization required'),
})
type FormData = z.infer<typeof schema>

const ROLE_LABELS: Record<string, string> = {
  team_member: 'Team Member',
  meeting_owner: 'Meeting Owner',
  workspace_manager: 'Workspace Manager',
  org_admin: 'Organization Admin',
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name, organization: user?.organization },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.patch('/me', data),
    onSuccess: (res) => {
      updateUser(res.data.data)
      toast.success('Profile updated')
    },
  })

  return (
    <div>
      <h1 className="page-header mb-6">Profile</h1>

      <div className="max-w-lg space-y-5">
        {/* Avatar / info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-600/30 border border-brand-500/20 flex items-center justify-center text-2xl text-brand-300 font-display">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="badge badge-blue mt-1">{ROLE_LABELS[user?.role ?? 'team_member']}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('name')} className="input-field" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Organization</label>
              <input {...register('organization')} className="input-field" />
              {errors.organization && <p className="error-text">{errors.organization.message}</p>}
            </div>
            <div>
              <label className="label">Email (read only)</label>
              <input value={user?.email} disabled className="input-field opacity-50" />
            </div>
            <div>
              <label className="label">Role (read only)</label>
              <input value={ROLE_LABELS[user?.role ?? '']} disabled className="input-field opacity-50" />
            </div>

            <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">
              {isSubmitting ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

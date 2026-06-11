import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/http/client'
import { useAuthStore } from '@/lib/auth/store'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['team_member', 'meeting_owner', 'workspace_manager', 'org_admin']),
  organization: z.string().min(2, 'Organization name required'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'team_member' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/auth/register', data)
      setAuth(res.data.data.user, res.data.data.token)
      toast.success('Account created! Welcome to AMMS.')
      navigate('/dashboard')
    } catch (err: any) {
      const details = err.response?.data?.error?.details
      if (details?.length) {
        details.forEach((d: any) => toast.error(`${d.field}: ${d.reason}`))
      } else {
        toast.error(err.response?.data?.error?.message || 'Registration failed')
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-600/8 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center glow-brand-sm">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-display tracking-wider text-2xl text-white">AMMS</span>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Start capturing meetings for free</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('name')} placeholder="Alex Johnson" className="input-field" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" placeholder="you@company.com" className="input-field" />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Organization</label>
              <input {...register('organization')} placeholder="Acme Corp" className="input-field" />
              {errors.organization && <p className="error-text">{errors.organization.message}</p>}
            </div>

            <div>
              <label className="label">Role</label>
              <select {...register('role')} className="input-field">
                <option value="team_member">Team Member</option>
                <option value="meeting_owner">Meeting Owner</option>
                <option value="workspace_manager">Workspace Manager</option>
                <option value="org_admin">Organization Admin</option>
              </select>
              {errors.role && <p className="error-text">{errors.role.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
              {isSubmitting ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}

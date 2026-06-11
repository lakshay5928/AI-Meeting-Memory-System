import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Upload, Plus, Trash2, ArrowLeft, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/http/client'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  duration: z.coerce.number().min(1).max(480).optional(),
  participants: z.array(z.object({
    name: z.string().min(1, 'Name required'),
    email: z.string().email('Valid email required'),
    role: z.string().optional(),
  })).optional(),
})
type FormData = z.infer<typeof schema>

export default function NewMeeting() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      participants: [{ name: '', email: '', role: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'participants' })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Create meeting record
      const res = await api.post('/meeting', data)
      const meetingId = res.data.data._id

      // Upload file if present
      if (file) {
        setUploading(true)
        const form = new FormData()
        form.append('recording', file)
        form.append('meetingId', meetingId)
        await api.post('/meeting/' + meetingId + '/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setUploading(false)
      }

      return meetingId
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Meeting created! Transcription will begin shortly.')
      navigate('/meetings/' + id)
    },
    onError: (err: any) => {
      setUploading(false)
      const msg = err.response?.data?.error?.message || 'Failed to create meeting'
      toast.error(msg)
    },
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['audio/mpeg','audio/wav','audio/ogg','audio/mp4','video/mp4','video/webm','video/quicktime']
    if (!allowed.includes(f.type)) {
      toast.error('Unsupported file type. Use MP3, WAV, MP4, or WebM.')
      return
    }
    if (f.size > 500 * 1024 * 1024) {
      toast.error('File too large. Maximum 500MB.')
      return
    }
    setFile(f)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-header">New Meeting</h1>
          <p className="text-gray-500 text-sm">Fill in the details and optionally upload a recording.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6 space-y-4">
              <h2 className="section-title">Meeting Details</h2>

              <div>
                <label className="label">Title *</label>
                <input {...register('title')} placeholder="Q2 Planning Session" className="input-field" />
                {errors.title && <p className="error-text">{errors.title.message}</p>}
              </div>

              <div>
                <label className="label">Description</label>
                <textarea {...register('description')} rows={3}
                  placeholder="Brief description of what was discussed..."
                  className="input-field resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date & Time *</label>
                  <input {...register('date')} type="datetime-local" className="input-field" />
                  {errors.date && <p className="error-text">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <input {...register('duration')} type="number" min={1} max={480}
                    placeholder="60" className="input-field" />
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">Participants</h2>
                <button type="button"
                  onClick={() => append({ name: '', email: '', role: '' })}
                  className="btn-ghost text-xs">
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {fields.map((field, i) => (
                  <motion.div key={field.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-2 items-start"
                  >
                    <div>
                      <input {...register(`participants.${i}.name`)}
                        placeholder="Name" className="input-field text-xs py-2" />
                      {errors.participants?.[i]?.name && (
                        <p className="error-text">{errors.participants[i]?.name?.message}</p>
                      )}
                    </div>
                    <div>
                      <input {...register(`participants.${i}.email`)}
                        placeholder="Email" className="input-field text-xs py-2" />
                      {errors.participants?.[i]?.email && (
                        <p className="error-text">{errors.participants[i]?.email?.message}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input {...register(`participants.${i}.role`)}
                        placeholder="Role" className="input-field text-xs py-2" />
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(i)}
                          className="p-2 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Upload */}
            <div className="card p-5">
              <h2 className="section-title">Recording (Optional)</h2>
              <p className="text-xs text-gray-500 mb-4">
                Upload an audio or video file. AI will transcribe it automatically.
              </p>
              <input ref={fileRef} type="file"
                accept="audio/*,video/*" className="hidden" onChange={handleFile} />

              {file ? (
                <div className="p-3 rounded-xl bg-brand-600/10 border border-brand-500/20">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-brand-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)}
                      className="text-gray-500 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-brand-500/40 hover:bg-brand-600/5 transition-all text-gray-500">
                  <Upload size={24} />
                  <span className="text-xs">Click to upload</span>
                  <span className="text-xs text-gray-600">MP3, WAV, MP4, WebM · Max 500MB</span>
                </button>
              )}
            </div>

            <button type="submit"
              disabled={isSubmitting || uploading}
              className="btn-primary w-full justify-center py-3">
              {isSubmitting || uploading ? (
                <><span className="spinner" /> {uploading ? 'Uploading…' : 'Creating…'}</>
              ) : 'Create Meeting'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

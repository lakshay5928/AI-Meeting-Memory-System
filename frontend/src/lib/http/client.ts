import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../auth/store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1/amms',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const message = err.response?.data?.error?.message || 'Something went wrong'

    if (status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    } else if (status === 403) {
      toast.error('You do not have permission to do that.')
    } else if (status === 429) {
      toast.error('Too many requests. Please slow down.')
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (status !== 400 && status !== 422) {
      // 400/422 shown inline via form errors
      toast.error(message)
    }

    return Promise.reject(err)
  },
)

export default api

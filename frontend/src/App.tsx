import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth/store'
import LandingPage    from '@/features/auth/LandingPage'
import LoginPage      from '@/features/auth/LoginPage'
import RegisterPage   from '@/features/auth/RegisterPage'
import DashboardLayout from '@/app/layouts/DashboardLayout'
import DashboardPage  from '@/features/dashboard/DashboardPage'
import MeetingsPage   from '@/features/meetings/MeetingsPage'
import MeetingDetail  from '@/features/meetings/MeetingDetail'
import NewMeeting     from '@/features/meetings/NewMeeting'
import TranscriptionPage from '@/features/transcription/TranscriptionPage'
import SummaryPage    from '@/features/summary/SummaryPage'
import ActionsPage    from '@/features/actions/ActionsPage'
import SearchPage     from '@/features/search/SearchPage'
import NotificationsPage from '@/features/notifications/NotificationsPage'
import AdminPage      from '@/features/admin/AdminPage'
import ProfilePage    from '@/features/auth/ProfilePage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'org_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<LandingPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — inside DashboardLayout */}
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="meetings"      element={<MeetingsPage />} />
          <Route path="meetings/new"  element={<NewMeeting />} />
          <Route path="meetings/:id"  element={<MeetingDetail />} />
          <Route path="meetings/:id/transcript" element={<TranscriptionPage />} />
          <Route path="meetings/:id/summary"    element={<SummaryPage />} />
          <Route path="actions"       element={<ActionsPage />} />
          <Route path="search"        element={<SearchPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile"       element={<ProfilePage />} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

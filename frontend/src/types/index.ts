export type Role = 'team_member' | 'meeting_owner' | 'workspace_manager' | 'org_admin'

export type MeetingStatus = 'draft' | 'processing' | 'transcribed' | 'summarized' | 'completed' | 'failed'

export type ActionItemStatus = 'pending' | 'in_progress' | 'done' | 'cancelled'

export interface ApiResponse<T> {
  data: T
  meta: { requestId: string; timestamp: string; total?: number; page?: number; limit?: number }
  error: null
}

export interface ApiError {
  data: null
  meta: { requestId: string; timestamp: string }
  error: { code: string; message: string; details?: { field: string; reason: string }[] }
}

export interface Meeting {
  _id: string
  title: string
  description?: string
  date: string
  duration?: number
  status: MeetingStatus
  participants: Participant[]
  recordingUrl?: string
  transcriptId?: string
  summaryId?: string
  workspaceId: string
  createdBy: { _id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface Participant {
  _id: string
  name: string
  email: string
  role?: string
  speakerLabel?: string
}

export interface TranscriptSegment {
  _id: string
  meetingId: string
  speaker: string
  speakerLabel?: string
  text: string
  startTime: number
  endTime: number
  confidence: number
  createdAt: string
}

export interface Summary {
  _id: string
  meetingId: string
  content: string
  keyPoints: string[]
  decisions: string[]
  aiModel: string
  aiVersion: string
  reviewedBy?: string
  correctedAt?: string
  createdAt: string
}

export interface ActionItem {
  _id: string
  meetingId: string
  text: string
  assignee?: { _id: string; name: string; email: string }
  dueDate?: string
  status: ActionItemStatus
  priority: 'low' | 'medium' | 'high'
  source: 'ai' | 'manual'
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  _id: string
  name: string
  description?: string
  members: { user: { _id: string; name: string; email: string }; role: Role }[]
  createdBy: string
  createdAt: string
}

export interface Notification {
  _id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export interface AuditEvent {
  _id: string
  actor: { _id: string; name: string; email: string }
  action: string
  target: string
  targetId: string
  metadata?: Record<string, unknown>
  ip?: string
  createdAt: string
}

export interface DashboardStats {
  totalMeetings: number
  transcribed: number
  actionItemsPending: number
  actionItemsDone: number
  weeklyActiveMeetings: number
  transcriptionCompletionRate: number
  searchSuccessRate: number
  recentMeetings: Meeting[]
  recentActions: ActionItem[]
}

export interface SearchResult {
  meetingId: string
  meetingTitle: string
  date: string
  snippet: string
  score: number
  type: 'transcript' | 'summary' | 'action'
}

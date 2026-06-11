import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

// ─── User ───────────────────────────────────────────────────
export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: 'team_member' | 'meeting_owner' | 'workspace_manager' | 'org_admin'
  organization: string
  avatar?: string
  status: 'active' | 'suspended'
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, select: false },
  role:         { type: String, enum: ['team_member','meeting_owner','workspace_manager','org_admin'], default: 'team_member' },
  organization: { type: String, required: true, trim: true },
  avatar:       { type: String },
  status:       { type: String, enum: ['active','suspended'], default: 'active' },
}, { timestamps: true })

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

UserSchema.methods.comparePassword = function(candidate: string) {
  return bcrypt.compare(candidate, this.password)
}

// email already has unique:true index above — don't re-declare
UserSchema.index({ organization: 1, role: 1 })

export const User = mongoose.model<IUser>('User', UserSchema)

// ─── Workspace ──────────────────────────────────────────────
const WorkspaceSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  members:     [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, role: String }],
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status:      { type: String, default: 'active' },
}, { timestamps: true })

export const Workspace = mongoose.model('Workspace', WorkspaceSchema)

// ─── Meeting ─────────────────────────────────────────────────
export interface IMeeting extends Document {
  title: string
  description?: string
  date: Date
  duration?: number
  status: 'draft'|'processing'|'transcribed'|'summarized'|'completed'|'failed'
  workspaceId?: mongoose.Types.ObjectId
  participants: Array<{ name:string; email:string; role?:string; speakerLabel?:string }>
  recordingUrl?: string
  recordingPublicId?: string
  transcriptId?: mongoose.Types.ObjectId
  summaryId?: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  organization: string
  createdAt: Date
  updatedAt: Date
}

const MeetingSchema = new Schema<IMeeting>({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date:        { type: Date, required: true },
  duration:    { type: Number, min: 0, max: 480 },
  status:      { type: String, enum: ['draft','processing','transcribed','summarized','completed','failed'], default: 'draft' },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  participants:[{
    name: { type: String, required: true },
    email: { type: String },
    role:  { type: String },
    speakerLabel: { type: String },
  }],
  recordingUrl:      { type: String },
  recordingPublicId: { type: String },
  transcriptId: { type: Schema.Types.ObjectId, ref: 'Transcript' },
  summaryId:    { type: Schema.Types.ObjectId, ref: 'Summary' },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: String, required: true },
}, { timestamps: true })

MeetingSchema.index({ organization: 1, status: 1, date: -1 })
MeetingSchema.index({ createdBy: 1, date: -1 })
MeetingSchema.index({ title: 'text', description: 'text' })

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema)

// ─── TranscriptSegment ────────────────────────────────────────
const TranscriptSegmentSchema = new Schema({
  meetingId:    { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  speaker:      { type: String, required: true },
  speakerLabel: { type: String },
  text:         { type: String, required: true },
  startTime:    { type: Number, required: true },
  endTime:      { type: Number, required: true },
  confidence:   { type: Number, default: 1 },
  embedding:    { type: [Number], select: false }, // vector for semantic search
}, { timestamps: true })

TranscriptSegmentSchema.index({ meetingId: 1, startTime: 1 })

export const TranscriptSegment = mongoose.model('TranscriptSegment', TranscriptSegmentSchema)

// ─── Summary ──────────────────────────────────────────────────
const SummarySchema = new Schema({
  meetingId:   { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  content:     { type: String, required: true },
  keyPoints:   [{ type: String }],
  decisions:   [{ type: String }],
  aiModel:     { type: String, default: 'gpt-3.5-turbo' },
  aiVersion:   { type: String },
  reviewedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  correctedAt: { type: Date },
}, { timestamps: true })

SummarySchema.index({ meetingId: 1 })

export const Summary = mongoose.model('Summary', SummarySchema)

// ─── ActionItem ───────────────────────────────────────────────
const ActionItemSchema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  text:      { type: String, required: true },
  assignee:  { type: Schema.Types.ObjectId, ref: 'User' },
  dueDate:   { type: Date },
  status:    { type: String, enum: ['pending','in_progress','done','cancelled'], default: 'pending' },
  priority:  { type: String, enum: ['low','medium','high'], default: 'medium' },
  source:    { type: String, enum: ['ai','manual'], default: 'ai' },
  organization: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

ActionItemSchema.index({ meetingId: 1 })
ActionItemSchema.index({ organization: 1, status: 1 })
ActionItemSchema.index({ assignee: 1, status: 1 })

export const ActionItem = mongoose.model('ActionItem', ActionItemSchema)

// ─── Notification ─────────────────────────────────────────────
const NotificationSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    { type: String },
  read:    { type: Boolean, default: false },
}, { timestamps: true })

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 })

export const Notification = mongoose.model('Notification', NotificationSchema)

// ─── AuditEvent ───────────────────────────────────────────────
const AuditEventSchema = new Schema({
  actor:     { _id: Schema.Types.ObjectId, name: String, email: String },
  action:    { type: String, required: true },
  target:    { type: String, required: true },
  targetId:  { type: String },
  metadata:  { type: Schema.Types.Mixed },
  ip:        { type: String },
  organization: { type: String },
}, { timestamps: true })

AuditEventSchema.index({ organization: 1, createdAt: -1 })

export const AuditEvent = mongoose.model('AuditEvent', AuditEventSchema)

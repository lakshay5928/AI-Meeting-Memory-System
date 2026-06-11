# Software Requirements Specification (SRS)
## AI Meeting Memory System (AMMS)
### Version 1.0 | Academic Year 2026

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the complete functional and non-functional requirements for AMMS — a permission-aware meeting workspace that transcribes recordings, produces traceable summaries, extracts action items, and enables semantic retrieval of organizational knowledge.

### 1.2 Scope
AMMS is a full-stack web application built with MongoDB, Express.js, React, and Node.js (MERN stack). It integrates AI services (OpenAI Whisper, GPT-3.5-turbo) for automated meeting intelligence and provides role-based access control across four user types.

### 1.3 Problem Statement
Decisions, context, action items, and ownership are routinely lost across recordings, notes, chat messages, and employee memory. Existing informal processes rely on spreadsheets, chat groups, and manual follow-up — approaches that are difficult to search, difficult to audit, and impossible to scale.

### 1.4 Definitions
| Term | Definition |
|------|-----------|
| AMMS | AI Meeting Memory System |
| SRS  | Software Requirements Specification |
| JWT  | JSON Web Token — used for stateless authentication |
| Whisper | OpenAI speech-to-text model |
| BullMQ | Redis-backed background job queue |

---

## 2. Overall Description

### 2.1 Product Perspective
AMMS is a standalone web application deployed on free-tier cloud infrastructure (Vercel + Render + MongoDB Atlas). It operates as a single-tenant or multi-organization system.

### 2.2 Product Functions (Summary)
- Secure user registration, login, and role management
- Meeting creation with participant tracking
- Audio/video recording upload and storage (Cloudinary)
- Automated transcription via OpenAI Whisper (background job)
- AI-generated summaries and decision extraction (GPT-3.5-turbo)
- Automatic action item extraction with priority and assignee
- Semantic search across transcripts and summaries
- Role-based access control (4 roles)
- Notification system for async updates
- Admin console with full audit trail

### 2.3 User Roles
| Role | Permissions |
|------|------------|
| Team Member | Register, view meetings, view own action items, notifications |
| Meeting Owner | Create/edit meetings, upload recordings, review summaries |
| Workspace Manager | Manage workspaces, export reports, view all org meetings |
| Organization Admin | Full access including user management, audit trail, configuration |

---

## 3. Functional Requirements

### 3.1 Authentication (FR-AUTH)
| ID | Requirement |
|----|------------|
| FR-AUTH-01 | System shall allow new users to register with name, email, password, role, and organization |
| FR-AUTH-02 | System shall hash passwords using bcrypt (minimum 12 rounds) |
| FR-AUTH-03 | System shall issue a signed JWT (7-day expiry) on successful login |
| FR-AUTH-04 | System shall reject suspended accounts with a clear error message |
| FR-AUTH-05 | System shall validate all registration input with field-level error messages |
| FR-AUTH-06 | System shall rate-limit login attempts (max 20 per 15 minutes per IP) |

### 3.2 Meeting Capture (FR-MEET)
| ID | Requirement |
|----|------------|
| FR-MEET-01 | System shall allow authorized users to create meetings with title, date, duration, description, and participants |
| FR-MEET-02 | System shall validate meeting input before creating any database record |
| FR-MEET-03 | System shall support audio/video uploads (MP3, WAV, MP4, WebM) up to 500MB |
| FR-MEET-04 | System shall upload recordings to Cloudinary and store the secure URL |
| FR-MEET-05 | System shall queue transcription job after successful upload |
| FR-MEET-06 | System shall expose meeting lifecycle status: draft → processing → transcribed → summarized → completed → failed |
| FR-MEET-07 | Only the meeting creator or org admin may edit or delete a meeting |

### 3.3 Transcription (FR-TRANS)
| ID | Requirement |
|----|------------|
| FR-TRANS-01 | System shall transcribe uploaded recordings using OpenAI Whisper via background queue |
| FR-TRANS-02 | System shall store transcript as individual segments with speaker label, start time, end time, and confidence score |
| FR-TRANS-03 | System shall update meeting status to "failed" if transcription errors occur |
| FR-TRANS-04 | System shall retry failed jobs up to 3 times with exponential backoff |
| FR-TRANS-05 | System shall notify the meeting creator when transcription completes or fails |

### 3.4 Summary Generation (FR-SUM)
| ID | Requirement |
|----|------------|
| FR-SUM-01 | System shall generate a summary automatically after transcription succeeds |
| FR-SUM-02 | Summary shall include: prose overview, key points list, decisions list |
| FR-SUM-03 | Summary shall store the AI model name and version for provenance |
| FR-SUM-04 | Authorized users shall be able to correct a summary; corrections shall be timestamped and logged to audit trail |
| FR-SUM-05 | UI shall display a disclaimer that the summary is AI-generated |

### 3.5 Action Items (FR-ACT)
| ID | Requirement |
|----|------------|
| FR-ACT-01 | System shall extract action items automatically from the transcript/summary |
| FR-ACT-02 | Each action item shall include: text, assignee (optional), due date (optional), priority (low/medium/high), source (ai/manual) |
| FR-ACT-03 | Users shall be able to change action item status: pending → in_progress → done → cancelled |
| FR-ACT-04 | Users shall be able to create manual action items |
| FR-ACT-05 | Action items shall be filterable by status, priority, and meeting |

### 3.6 Semantic Search (FR-SRCH)
| ID | Requirement |
|----|------------|
| FR-SRCH-01 | System shall support full-text search across meeting titles and descriptions |
| FR-SRCH-02 | System shall generate vector embeddings for transcript segments (text-embedding-3-small) |
| FR-SRCH-03 | System shall return ranked search results with relevance score and text snippet |
| FR-SRCH-04 | System shall fall back to keyword search if embedding service is unavailable |
| FR-SRCH-05 | Search results shall only include meetings from the user's organization |

### 3.7 Notifications (FR-NOTIF)
| ID | Requirement |
|----|------------|
| FR-NOTIF-01 | System shall create in-app notifications for: transcription complete, transcription failed |
| FR-NOTIF-02 | Users shall be able to mark individual or all notifications as read |
| FR-NOTIF-03 | Sidebar shall display unread notification count badge |

### 3.8 Admin Console (FR-ADMIN)
| ID | Requirement |
|----|------------|
| FR-ADMIN-01 | Organization admin shall have access to audit trail showing all actions |
| FR-ADMIN-02 | Admin console shall display: total users, total meetings, weekly active, recent audit events |
| FR-ADMIN-03 | All audit events shall record: actor, action, target, IP address, timestamp |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- 95th percentile API response < 500ms for indexed read operations
- Write acknowledgements within 2 seconds
- Background jobs expose queue status (queued, processing, completed, failed)

### 4.2 Security
- Passwords hashed with bcrypt (12 rounds)
- JWT signed with 64-byte secret
- All inputs validated with Zod schemas on the server
- CORS restricted to known origin
- Rate limiting on auth endpoints (20 req/15 min)
- File uploads validated for MIME type and size
- Org-level data isolation on every query

### 4.3 Reliability
- Failed transcription jobs retried 3× with exponential backoff
- AI unavailability does not block core CRUD workflows
- Database connection errors terminate the process (prevent silent failures)

### 4.4 Accessibility
- All interactive elements keyboard accessible
- WCAG 2.1 AA color contrast ratios
- Semantic HTML with ARIA labels
- Visible focus indicators

### 4.5 Maintainability
- TypeScript used throughout (frontend and backend)
- Zod validation schemas shared between handler and docs
- Modular backend folder structure (one folder per domain)
- Environment config centralized in config/index.ts

---

## 5. System Architecture

### 5.1 Technology Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite + TypeScript | Fast build, great DX |
| Styling | Tailwind CSS + Framer Motion | Dark theme, animations |
| State | Zustand (auth) + React Query (server state) | Minimal, correct |
| Backend | Node.js + Express + TypeScript | Familiar, fast |
| Database | MongoDB Atlas (free M0) | Document model suits meetings |
| Queue | BullMQ + Upstash Redis (free) | Reliable background jobs |
| File Storage | Cloudinary (free 25GB) | Audio/video, signed URLs |
| AI (Speech) | OpenAI Whisper | Best accuracy, affordable |
| AI (Summary) | OpenAI GPT-3.5-turbo | Cost-effective, JSON mode |
| AI (Search) | OpenAI text-embedding-3-small | Semantic search |
| Deploy FE | Vercel (free) | Zero-config React deploy |
| Deploy BE | Render (free) | Node.js + auto-deploy |
| Email | Resend (free 3K/mo) | Notification emails |

### 5.2 Data Flow
```
Browser → Vercel (React SPA)
         ↓
         Render (Express API) ← JWT Auth Middleware
         ↓           ↓
    MongoDB Atlas   Upstash Redis (BullMQ Queue)
                         ↓
                    Worker Process
                         ↓
                  Cloudinary (download audio)
                  OpenAI Whisper (transcribe)
                  OpenAI GPT (summarize)
                  MongoDB (save results)
                  Notification created
```

---

## 6. Database Schema

### 6.1 User
```
_id, name, email (unique), password (hashed), role, organization,
avatar, status (active|suspended), createdAt, updatedAt
```

### 6.2 Meeting
```
_id, title, description, date, duration, status, organization,
participants[], recordingUrl, recordingPublicId,
transcriptId, summaryId, createdBy (ref User), createdAt, updatedAt
```

### 6.3 TranscriptSegment
```
_id, meetingId, speaker, speakerLabel, text,
startTime, endTime, confidence, embedding (vector), createdAt
```

### 6.4 Summary
```
_id, meetingId, content, keyPoints[], decisions[],
aiModel, aiVersion, reviewedBy, correctedAt, createdAt
```

### 6.5 ActionItem
```
_id, meetingId, text, assignee (ref User), dueDate,
status, priority, source (ai|manual), organization, createdBy, createdAt, updatedAt
```

### 6.6 Notification
```
_id, userId, type, title, message, link, read, createdAt
```

### 6.7 AuditEvent
```
_id, actor {_id, name, email}, action, target, targetId,
metadata, ip, organization, createdAt
```

---

## 7. API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | Public | Register new user |
| POST | /auth/login | Public | Login and get JWT |
| GET | /me | ✓ | Get current user profile |
| PATCH | /me | ✓ | Update profile |
| GET | /meeting | ✓ | List meetings (paginated, filtered) |
| POST | /meeting | ✓ | Create meeting |
| GET | /meeting/:id | ✓ | Get meeting detail |
| PATCH | /meeting/:id | ✓ Owner/Admin | Update meeting |
| DELETE | /meeting/:id | ✓ Owner/Admin | Delete meeting |
| POST | /meeting/:id/upload | ✓ Owner | Upload recording |
| GET | /meeting/:id/transcript | ✓ | Get transcript segments |
| GET | /meeting/:id/summary | ✓ | Get AI summary |
| PATCH | /meeting/:id/summary | ✓ | Correct summary |
| GET | /action-items | ✓ | List action items |
| POST | /action-items | ✓ | Create manual action item |
| PATCH | /action-items/:id | ✓ | Update action item status |
| POST | /transcriptsegment | ✓ | Re-trigger transcription |
| GET | /semantic-search?q= | ✓ | Semantic + keyword search |
| GET | /notifications | ✓ | List notifications |
| GET | /notifications/unread-count | ✓ | Get badge count |
| PATCH | /notifications/:id | ✓ | Mark as read |
| POST | /notifications/mark-all-read | ✓ | Mark all read |
| GET | /dashboard | ✓ | Role-specific dashboard stats |
| GET | /admin/audit-events | ✓ Admin | Full audit trail |
| GET | /admin/stats | ✓ Admin | Org-level stats |

---

## 8. Security & Privacy

### 8.1 Risk Register
| Risk | Likelihood | Impact | Control |
|------|-----------|--------|---------|
| Recording without participant consent | Medium | High | Consent notice on upload screen; legal disclaimer in UI |
| AI hallucinated summaries misrepresent decisions | Medium | High | Correction button; AI disclaimer; audit log |
| Cross-org data leakage | Low | Critical | Organization field on every query; tested with unauthorized user |
| Account takeover | Medium | High | Bcrypt hashing; rate limiting; JWT expiry |
| Oversized file upload | High | Medium | 500MB size limit; MIME type validation |
| Prompt injection via transcript | Low | Medium | AI output validated as strict JSON; never executed |

---

## 9. AI Responsible Use

### 9.1 AI Boundaries
- AI is used ONLY for: transcription, summarization, action extraction, embeddings
- AI output is ALWAYS validated against a strict schema before storage
- AI output is NEVER executed as code or instructions
- All AI calls include model name and version for provenance
- Fallback behavior: if AI unavailable, meeting status stays at "draft" with clear error

### 9.2 Limitations Disclosed to Users
- Summaries may contain inaccuracies — always verify against original recording
- Speaker diarization is approximate (heuristic-based for free tier)
- Transcription accuracy varies with audio quality and accents

### 9.3 Evaluation Criteria
- Transcription: Word Error Rate (WER) measured against manual transcript on 10 test files
- Summary: Human review of 20 generated summaries for factual accuracy
- Action items: Precision/Recall on 15 test meeting transcripts

---

## 10. Testing Strategy

| Layer | Tool | Coverage |
|-------|------|---------|
| Unit | Jest | Scoring, validation, utilities |
| Integration | Jest + Supertest | All API routes |
| E2E | Manual / Playwright | Primary workflow |
| Security | Manual | Auth bypass, IDOR, payload injection |
| Accessibility | axe-core | All major screens |
| Load | Artillery | Dashboard + search endpoints |

---

## 11. Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                   PRODUCTION                     │
│                                                  │
│  Vercel (Frontend)    Render (Backend API)       │
│  ─────────────────    ─────────────────────      │
│  React + Vite SPA     Express + Node.js          │
│  Auto-deploy on push  Auto-deploy on push        │
│         │                     │                  │
│         └──────────┬──────────┘                  │
│                    │                             │
│  MongoDB Atlas     Upstash Redis   Cloudinary    │
│  ─────────────     ─────────────   ──────────    │
│  Free M0 cluster   Free queue      Free 25GB     │
│  512MB storage     10K req/day     Audio/video   │
└─────────────────────────────────────────────────┘
```

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| Diarization | Process of labeling which speaker said what in a transcript |
| Embedding | Numerical vector representation of text for semantic comparison |
| BullMQ | Redis-based job queue for background processing |
| CORS | Cross-Origin Resource Sharing — browser security policy |
| Soft delete | Marking records as deleted without removing from DB (future feature) |
| Idempotency | Ensuring repeated identical requests produce the same result |

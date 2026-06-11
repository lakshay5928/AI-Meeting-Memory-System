# 🧠 AI Meeting Memory System (AMMS)

> Never lose a decision, action item, or context from your meetings again.

![AMMS Banner](https://img.shields.io/badge/AMMS-AI%20Meeting%20Memory%20System-5c7cfa?style=for-the-badge&logo=react)
![Node](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=nodedotjs)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)
![Groq](https://img.shields.io/badge/AI-Groq%20Free-orange?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Roles & Permissions](#-roles--permissions)
- [AI Integration](#-ai-integration)
- [Deployment](#-deployment)
- [Demo Credentials](#-demo-credentials)
- [Screenshots](#-screenshots)

---

## 🔥 Problem Statement

Decisions, context, action items, and ownership are lost across recordings, notes, chat messages, and employee memory. Existing informal processes rely on spreadsheets, chat groups, and manual follow-up — approaches that are difficult to search, audit, or scale.

**AMMS solves this** with a permission-aware meeting workspace that:
- Transcribes recordings automatically
- Produces traceable AI summaries
- Extracts action items with assignees
- Enables semantic search across all meetings

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎙️ **AI Transcription** | Upload audio/video → Groq Whisper converts speech to searchable text |
| 📄 **Smart Summary** | LLaMA 3.1 generates structured summary with key points and decisions |
| ✅ **Action Items** | AI extracts tasks with assignee, priority, and due date automatically |
| 🔍 **Semantic Search** | Search meeting content in plain language |
| 🔐 **Role-Based Access** | 4 roles with granular permission control |
| 🔔 **Notifications** | Real-time alerts for transcription complete, assignments |
| 📊 **Dashboard** | Role-specific stats and recent activity |
| 🛡️ **Audit Trail** | Every action logged — who did what and when |
| ✏️ **Summary Correction** | Edit AI summaries — corrections logged for accountability |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite + TypeScript | SPA framework |
| Tailwind CSS | Dark theme styling |
| Framer Motion | Animations |
| Zustand | Auth state management |
| React Query | Server state & caching |
| React Hook Form + Zod | Form validation |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express + TypeScript | REST API |
| MongoDB Atlas | Database (free M0 cluster) |
| BullMQ + Upstash Redis | Background job queue |
| Cloudinary | Audio/video file storage |
| Groq API (FREE) | Whisper transcription + LLaMA summary |
| JWT | Authentication |
| Zod | Input validation |

### Infrastructure (All Free)
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas M0 | Database |
| Upstash Redis | Queue |
| Cloudinary | File storage |
| Groq | AI (completely free) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AMMS Architecture                     │
│                                                         │
│  Browser (React SPA)                                    │
│       │                                                 │
│       ▼                                                 │
│  Vercel (Frontend) ──────► Render (Express API)        │
│                                  │                      │
│                     ┌────────────┼────────────┐        │
│                     ▼            ▼            ▼        │
│              MongoDB Atlas  Upstash Redis  Cloudinary  │
│                                  │                      │
│                             BullMQ Worker               │
│                                  │                      │
│                    ┌─────────────┴──────────┐          │
│                    ▼                        ▼          │
│             Groq Whisper             Groq LLaMA        │
│           (Transcription)           (Summary+Actions)  │
└─────────────────────────────────────────────────────────┘
```

### Request Flow
```
User uploads recording
       │
       ▼
Cloudinary (stores file)
       │
       ▼
BullMQ Queue (background job)
       │
       ▼
Groq Whisper API → TranscriptSegments saved to MongoDB
       │
       ▼
Groq LLaMA API → Summary + ActionItems saved to MongoDB
       │
       ▼
Notification sent to meeting creator
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Git

### Installation

```bash
# Clone the repo
git clone https://github.com/lakshay5928/AI-Meeting-Memory-System.git
cd AI-Meeting-Memory-System
```

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (see Environment Variables below)
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Seed demo data
```bash
cd backend
npm run seed
```

Open `http://localhost:3000`

---

## 🔑 Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB Atlas (free) — https://cloud.mongodb.com
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/amms

# JWT
JWT_SECRET=your_64_char_secret_here
JWT_EXPIRES_IN=7d

# Cloudinary (free 25GB) — https://cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq (completely FREE) — https://console.groq.com
GROQ_API_KEY=gsk_your_key_here

# Upstash Redis (free) — https://console.upstash.com
REDIS_URL=rediss://default:password@host.upstash.io:6379

# Resend email (free 3K/mo) — https://resend.com
RESEND_API_KEY=re_your_key_here

# Frontend URL
APP_ORIGIN=http://localhost:3000
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/amms/auth/register` | Register new user |
| POST | `/api/v1/amms/auth/login` | Login |
| GET | `/api/v1/amms/me` | Get current user |
| PATCH | `/api/v1/amms/me` | Update profile |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/amms/meeting` | List meetings |
| POST | `/api/v1/amms/meeting` | Create meeting |
| GET | `/api/v1/amms/meeting/:id` | Get meeting detail |
| PATCH | `/api/v1/amms/meeting/:id` | Update meeting |
| DELETE | `/api/v1/amms/meeting/:id` | Delete meeting |
| POST | `/api/v1/amms/meeting/:id/upload` | Upload recording |
| GET | `/api/v1/amms/meeting/:id/transcript` | Get transcript |
| GET | `/api/v1/amms/meeting/:id/summary` | Get AI summary |
| PATCH | `/api/v1/amms/meeting/:id/summary` | Correct summary |

### Actions & Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/amms/action-items` | List action items |
| POST | `/api/v1/amms/action-items` | Create action item |
| PATCH | `/api/v1/amms/action-items/:id` | Update status |
| GET | `/api/v1/amms/semantic-search?q=` | Search meetings |

### Dashboard & Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/amms/dashboard` | Dashboard stats |
| GET | `/api/v1/amms/notifications` | List notifications |
| GET | `/api/v1/amms/admin/audit-events` | Audit trail (admin) |
| GET | `/api/v1/amms/admin/stats` | Org stats (admin) |

---

## 👥 Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Team Member** | View meetings, action items, notifications, search |
| **Meeting Owner** | Create/edit meetings, upload recordings, correct summaries |
| **Workspace Manager** | All above + reports, workspace management |
| **Org Admin** | Full access + user management + audit trail + admin console |

---

## 🤖 AI Integration

### Transcription — Groq Whisper Large V3
- Converts audio/video to text segments with timestamps
- Speaker diarization (heuristic-based)
- Confidence scores per segment
- Supports: MP3, WAV, M4A, MP4, WebM (max 25MB)

### Summarization — Groq LLaMA 3.1 8B
- Generates structured prose summary
- Extracts key points and decisions
- Identifies action items with assignee + priority
- Returns validated JSON (never executed as code)

### Responsible AI Practices
- ✅ AI output validated against strict schema
- ✅ Model name + version stored for provenance
- ✅ Summary correction path with audit logging
- ✅ AI disclaimer shown to users
- ✅ Deterministic fallback if AI unavailable
- ✅ No sensitive data sent without permission check

---

## 🌐 Deployment

### Frontend → Vercel (Free)
1. Go to [vercel.com](https://vercel.com) → Import GitHub repo
2. Root directory: `frontend`
3. Framework: Vite
4. Add env: `VITE_API_URL=https://your-backend.onrender.com/api/v1/amms`
5. Deploy

### Backend → Render (Free)
1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo
3. Root directory: `backend`
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add all environment variables
7. Deploy

---

## 🎭 Demo Credentials

After running `npm run seed` in the backend:

| Role | Email | Password |
|------|-------|---------|
| Org Admin | admin@amms-seed.dev | Demo1234! |
| Meeting Owner | owner@amms-seed.dev | Demo1234! |
| Team Member | member@amms-seed.dev | Demo1234! |

---

## 📁 Project Structure

```
AI-Meeting-Memory-System/
├── frontend/                   # React + Vite SPA
│   └── src/
│       ├── features/           # Pages (auth, meetings, search...)
│       ├── lib/                # API client, auth store
│       ├── components/         # Reusable UI components
│       └── styles/             # Global dark theme CSS
├── backend/                    # Node.js + Express API
│   └── src/
│       ├── modules/            # Route handlers by domain
│       ├── database/           # Models + seed data
│       ├── jobs/               # Background transcription worker
│       ├── integrations/       # Groq AI + Cloudinary
│       └── common/             # Auth, errors, logging
├── docs/
│   └── SRS.md                  # Software Requirements Specification
└── docker-compose.yml          # Local dev with Docker
```

---


---

## 👨‍💻 Team

<table>
  <tr>
    <td align="center">
      <strong>Lakshay Verma</strong><br/>
      <sub>Team Leader</sub><br/>
      <sub>Full Stack Development, AI Integration, Architecture</sub>
    </td>
    <td align="center">
      <strong>Khushi Sharma</strong><br/>
      <sub>Team Member</sub><br/>
      <sub>Frontend Development, UI/UX Design, Testing</sub>
    </td>
  </tr>
</table>

## 📄 License

MIT License — free to use for academic and personal projects.

---

<div align="center">
  <p>Built with ❤️ using MERN Stack + Groq AI</p>
  <p>
    <a href="https://console.groq.com">Groq (Free AI)</a> •
    <a href="https://cloud.mongodb.com">MongoDB Atlas</a> •
    <a href="https://cloudinary.com">Cloudinary</a> •
    <a href="https://vercel.com">Vercel</a> •
    <a href="https://render.com">Render</a>
  </p>
</div>

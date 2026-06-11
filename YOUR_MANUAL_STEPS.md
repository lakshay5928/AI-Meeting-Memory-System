# ╔══════════════════════════════════════════════════════════╗
# ║        AMMS — YOUR MANUAL STEPS AFTER UNZIP             ║
# ║   Read this completely before touching anything         ║
# ╚══════════════════════════════════════════════════════════╝

Everything in the zip file is production-ready code.
You only need to do these steps to go from zip → live site.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CREATE FREE ACCOUNTS (do all of these first)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1a. MongoDB Atlas (free database)
    → Go to: https://cloud.mongodb.com
    → Sign up free → Create a project → Build a Database
    → Choose M0 FREE tier → Region: AWS (closest to you)
    → Create cluster → Username + Password (save these!)
    → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
    → Connect → Drivers → Copy the connection string
    → Replace <password> with your password
    ✅ You get: DATABASE_URL=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/amms

1b. Cloudinary (free file storage — 25GB)
    → Go to: https://cloudinary.com
    → Sign up free → Dashboard shows:
    ✅ You get: Cloud Name, API Key, API Secret

1c. Groq (FREE AI — no credit card needed)
    → Go to: https://console.groq.com
    → Sign up → API Keys → Create new key
    → Completely free — no credit card, no billing
    ✅ You get: GROQ_API_KEY=gsk_...

1d. Upstash Redis (free queue — 10K req/day)
    → Go to: https://console.upstash.com
    → Sign up → Create Database → Free tier
    → Copy "Redis URL" (starts with rediss://)
    ✅ You get: REDIS_URL=rediss://default:password@host:6379

1e. Resend (free email — 3000/month)
    → Go to: https://resend.com
    → Sign up → API Keys → Create API key
    ✅ You get: RESEND_API_KEY=re_...

1f. GitHub account (for deployment)
    → https://github.com → Sign up free

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — CONFIGURE ENVIRONMENT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2a. Copy the env template:
    cd backend
    cp .env.example .env

2b. Open backend/.env and fill in ALL values:
    DATABASE_URL=    ← from step 1a
    JWT_SECRET=      ← run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    CLOUDINARY_CLOUD_NAME=  ← from step 1b
    CLOUDINARY_API_KEY=     ← from step 1b
    CLOUDINARY_API_SECRET=  ← from step 1b
    GROQ_API_KEY=           ← from step 1c (console.groq.com - FREE)
    REDIS_URL=              ← from step 1d
    RESEND_API_KEY=         ← from step 1e
    APP_ORIGIN=http://localhost:3000   ← change to Vercel URL after deploy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — INSTALL & RUN LOCALLY (test before deploying)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Requirements: Node.js 20+ installed (https://nodejs.org)

Terminal 1 — Backend:
    cd amms-project/backend
    npm install
    npm run dev
    → Should print: ✅ MongoDB connected
    → Should print: 🚀 AMMS API running on port 5000

Terminal 2 — Frontend:
    cd amms-project/frontend
    npm install
    npm run dev
    → Should print: Local: http://localhost:3000

Terminal 3 — Seed demo data (optional but recommended):
    cd amms-project/backend
    npm run seed
    → Creates 3 demo users with meetings and action items

Open browser: http://localhost:3000
Login with: admin@amms-seed.dev / Demo1234!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — DEPLOY TO INTERNET (free, live URL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── Deploy Backend to Render ──────────────────────────────

4a. Push code to GitHub:
    git init
    git add .
    git commit -m "Initial commit"
    → Create new repo on github.com/new (name: amms-backend)
    git remote add origin https://github.com/YOURUSERNAME/amms-backend
    git push -u origin main

4b. Go to: https://render.com → Sign up with GitHub
    → New → Web Service → Connect your amms-backend repo
    → Runtime: Node → Build: npm install && npm run build
    → Start: npm start
    → Add Environment Variables (copy from your .env file)
    → Create Web Service
    → Wait ~5 min → You get a URL like: https://amms-backend.onrender.com

── Deploy Frontend to Vercel ─────────────────────────────

4c. Go to: https://vercel.com → Sign up with GitHub
    → New Project → Import amms-frontend repo
    → Framework: Vite
    → Add Environment Variable:
       VITE_API_URL = https://amms-backend.onrender.com/api/v1/amms
    → Deploy
    → You get a URL like: https://amms-frontend.vercel.app

4d. Update backend .env on Render:
    APP_ORIGIN = https://amms-frontend.vercel.app
    (In Render dashboard → Environment → Update APP_ORIGIN)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — VERIFY EVERYTHING WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Visit your Vercel URL → See the landing page
✅ Register a new account
✅ Create a meeting
✅ Upload a small .mp3 file (test with a 1-min audio)
✅ Wait 1-2 min → Meeting status changes to "completed"
✅ See transcript, summary, action items

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Render free tier "sleeps" after 15 min of inactivity.
    First request after sleep takes ~30 sec to wake up.
    This is fine for demo. Upgrade to $7/mo to fix this.

⚠️  OpenAI costs ~$0.006 per minute of audio (Whisper).
    GPT-3.5-turbo summaries cost ~$0.002 per meeting.
    $5 credit handles 500+ demo meetings easily.

⚠️  MongoDB Atlas free tier = 512MB storage.
    Enough for 1000+ meetings.

⚠️  Cloudinary free tier = 25GB bandwidth + storage.
    Each uploaded audio file counts toward this.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEMO CREDENTIALS (after running seed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Role            Email                     Password
─────────────────────────────────────────────────────
Org Admin       admin@amms-seed.dev       Demo1234!
Meeting Owner   owner@amms-seed.dev       Demo1234!
Team Member     member@amms-seed.dev      Demo1234!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

amms-project/
├── frontend/               React + Vite app
│   ├── src/
│   │   ├── features/       All page components
│   │   ├── lib/            API client, auth store
│   │   ├── styles/         Global CSS (dark theme)
│   │   └── types/          TypeScript interfaces
│   └── vercel.json         Vercel config
├── backend/                Node.js + Express API
│   ├── src/
│   │   ├── modules/        Route handlers (auth, meetings, etc.)
│   │   ├── database/       Models + seed data
│   │   ├── jobs/           Transcription worker (BullMQ)
│   │   ├── integrations/   OpenAI + Cloudinary
│   │   └── common/         Auth, errors, logging
│   ├── .env.example        Fill this in!
│   └── render.yaml         Render deploy config
├── docs/                   SRS and documentation
└── docker-compose.yml      Local dev with Docker

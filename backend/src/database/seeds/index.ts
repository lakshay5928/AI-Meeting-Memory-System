import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import { User, Meeting, ActionItem, Notification, AuditEvent } from '../models'

async function seed() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl || !/^mongodb(?:\+srv)?:\/\//i.test(dbUrl) || dbUrl.includes('<password>')) {
    console.error('❌ DATABASE_URL is missing or invalid in backend/.env')
    console.error('   Set a valid mongodb:// or mongodb+srv:// Atlas connection string.')
    process.exit(1)
  }

  console.log('🌱 Connecting to MongoDB...')
  await mongoose.connect(dbUrl)
  console.log('✅ Connected')

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({ email: /@amms-seed\.dev$/ }),
    Meeting.deleteMany({ organization: 'AMMS Demo Org' }),
    ActionItem.deleteMany({ organization: 'AMMS Demo Org' }),
    Notification.deleteMany({}),
    AuditEvent.deleteMany({ organization: 'AMMS Demo Org' }),
  ])
  console.log('🗑️  Cleared old seed data')

  // Create users
  const admin = await User.create({
    name: 'Alex Admin',
    email: 'admin@amms-seed.dev',
    password: 'Demo1234!',
    role: 'org_admin',
    organization: 'AMMS Demo Org',
  })

  const owner = await User.create({
    name: 'Morgan Owner',
    email: 'owner@amms-seed.dev',
    password: 'Demo1234!',
    role: 'meeting_owner',
    organization: 'AMMS Demo Org',
  })

  const member = await User.create({
    name: 'Sam Member',
    email: 'member@amms-seed.dev',
    password: 'Demo1234!',
    role: 'team_member',
    organization: 'AMMS Demo Org',
  })

  // Create meetings
  const m1 = await Meeting.create({
    title: 'Q2 Product Roadmap Review',
    description: 'Quarterly review of product roadmap and upcoming milestones.',
    date: new Date('2026-05-15T10:00:00Z'),
    duration: 60,
    status: 'completed',
    organization: 'AMMS Demo Org',
    createdBy: admin._id,
    participants: [
      { name: 'Alex Admin',  email: 'admin@amms-seed.dev',  role: 'Product Lead' },
      { name: 'Morgan Owner',email: 'owner@amms-seed.dev',  role: 'Engineering Lead' },
      { name: 'Sam Member',  email: 'member@amms-seed.dev', role: 'Designer' },
    ],
  })

  const m2 = await Meeting.create({
    title: 'Sprint 14 Planning',
    description: 'Planning session for sprint 14 including backlog grooming.',
    date: new Date('2026-05-22T14:00:00Z'),
    duration: 90,
    status: 'summarized',
    organization: 'AMMS Demo Org',
    createdBy: admin._id,
    participants: [
      { name: 'Alex Admin', email: 'admin@amms-seed.dev', role: 'Scrum Master' },
      { name: 'Sam Member', email: 'member@amms-seed.dev', role: 'Developer' },
    ],
  })

  await Meeting.create({
    title: 'Infrastructure Security Audit',
    description: 'Monthly infrastructure and security review.',
    date: new Date('2026-06-01T09:00:00Z'),
    duration: 45,
    status: 'draft',
    organization: 'AMMS Demo Org',
    createdBy: admin._id,
    participants: [{ name: 'Alex Admin', email: 'admin@amms-seed.dev', role: 'Admin' }],
  })

  // Action items
  await ActionItem.insertMany([
    {
      meetingId: m1._id,
      text: 'Finalize the API design spec for v2 endpoints by end of week',
      assignee: owner._id,
      priority: 'high',
      status: 'in_progress',
      dueDate: new Date('2026-06-10'),
      source: 'ai',
      organization: 'AMMS Demo Org',
    },
    {
      meetingId: m1._id,
      text: 'Update the product roadmap slide deck with Q3 milestones',
      assignee: member._id,
      priority: 'medium',
      status: 'pending',
      dueDate: new Date('2026-06-15'),
      source: 'ai',
      organization: 'AMMS Demo Org',
    },
    {
      meetingId: m1._id,
      text: 'Schedule user research sessions with 5 customers',
      assignee: admin._id,
      priority: 'medium',
      status: 'done',
      source: 'ai',
      organization: 'AMMS Demo Org',
    },
    {
      meetingId: m2._id,
      text: 'Set up CI/CD pipeline for the new microservice',
      assignee: owner._id,
      priority: 'high',
      status: 'pending',
      dueDate: new Date('2026-06-08'),
      source: 'ai',
      organization: 'AMMS Demo Org',
    },
    {
      meetingId: m2._id,
      text: 'Write unit tests for the authentication module',
      priority: 'medium',
      status: 'pending',
      source: 'manual',
      organization: 'AMMS Demo Org',
    },
  ])

  // Notifications
  await Notification.insertMany([
    {
      userId: admin._id,
      type: 'transcription_complete',
      title: 'Meeting transcribed ✅',
      message: '"Q2 Product Roadmap Review" has been transcribed and summarized.',
      link: `/meetings/${m1._id}`,
      read: false,
    },
    {
      userId: owner._id,
      type: 'action_assigned',
      title: 'New action item assigned',
      message: 'You have been assigned: "Finalize the API design spec"',
      link: `/actions`,
      read: false,
    },
  ])

  console.log('')
  console.log('✅ Seed complete!')
  console.log('─────────────────────────────────────────────')
  console.log('Demo credentials:')
  console.log('  Admin:  admin@amms-seed.dev  / Demo1234!')
  console.log('  Owner:  owner@amms-seed.dev  / Demo1234!')
  console.log('  Member: member@amms-seed.dev / Demo1234!')
  console.log('─────────────────────────────────────────────')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e.message)
  process.exit(1)
})

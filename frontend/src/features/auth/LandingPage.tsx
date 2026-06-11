import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Zap, Brain, Search, CheckSquare, Shield, Play } from 'lucide-react'

const FEATURES = [
  { icon: Brain,       title: 'AI Transcription',   desc: 'Upload any audio or video. Our AI converts speech to searchable text in minutes using Whisper.' },
  { icon: Zap,         title: 'Smart Summaries',    desc: 'Automatically extract key decisions, discussion points, and outcomes from every meeting.' },
  { icon: CheckSquare, title: 'Action Tracking',    desc: 'Never miss a deadline. AI identifies and assigns action items with due dates.' },
  { icon: Search,      title: 'Semantic Search',    desc: 'Ask questions about your meetings in plain language. Find anything instantly.' },
  { icon: Shield,      title: 'Role Permissions',   desc: 'Granular access control keeps sensitive decisions visible only to the right people.' },
  { icon: Play,        title: 'Audit Trail',        desc: 'Every change logged. Full transparency on who did what and when.' },
]

const STATS = [
  { value: '10x', label: 'Faster retrieval' },
  { value: '95%', label: 'Transcription accuracy' },
  { value: '0',   label: 'Decisions lost' },
  { value: '4',   label: 'Role levels' },
]

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.5 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(92,124,250,${p.a})`
        ctx.fill()
      })
      // Lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(92,124,250,${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

export default function LandingPage() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -120])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <div className="bg-dark-900 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center glow-brand-sm">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-display tracking-wider text-xl">AMMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started <ArrowRight size={14} /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Particle background */}
        <div className="absolute inset-0">
          <ParticleCanvas />
        </div>

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />

        {/* Grid */}
        <div className="absolute inset-0 grid-bg opacity-60" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/30 text-sm text-brand-300 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI-Powered · Free to Deploy · Open Source Ready
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-[clamp(4rem,12vw,9rem)] leading-none tracking-wider mb-6"
          >
            <span className="block text-white">NEVER</span>
            <span className="block text-gradient">LOSE A</span>
            <span className="block text-white">DECISION</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AMMS transcribes your meetings, extracts action items, and makes every decision
            searchable — powered by AI, secured by role-based permissions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <Link to="/register" className="btn-primary text-base px-8 py-4">
              Start Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4">
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 text-xs"
        >
          <span>SCROLL</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-0.5 h-8 bg-gradient-to-b from-brand-500 to-transparent rounded-full"
          />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800/50 to-dark-900" />
        <div className="relative max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-5xl text-gradient mb-2">{s.value}</div>
              <div className="text-sm text-gray-500 uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-5xl md:text-7xl tracking-wider mb-4">
              <span className="text-white">EVERY</span>{' '}
              <span className="text-gradient">FEATURE</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Built for teams who take their decisions seriously.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="card group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-600/30 transition-colors">
                  <f.icon size={20} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/20 via-dark-800/50 to-dark-900" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl md:text-6xl tracking-wider text-white mb-6"
          >
            HOW IT <span className="text-gradient">WORKS</span>
          </motion.h2>
          <div className="grid md:grid-cols-5 gap-4 mt-12 items-center">
            {['Upload Recording', 'AI Transcribes', 'Summarize', 'Extract Actions', 'Search & Share'].map((step, i) => (
              <motion.div key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-display text-xl">
                  {i + 1}
                </div>
                <p className="text-xs text-gray-400 text-center">{step}</p>
                {i < 4 && <div className="hidden md:block absolute translate-x-24 w-8 h-0.5 bg-brand-500/20" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-brand-600/8 blur-[100px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-2xl mx-auto text-center"
        >
          <h2 className="font-display text-6xl md:text-8xl tracking-wider text-white mb-6">
            START<br /><span className="text-gradient">TODAY</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Free to use. No credit card. Deploy on your own infrastructure.
          </p>
          <Link to="/register" className="btn-primary text-lg px-10 py-5 glow-brand">
            Create Free Account <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 px-6 text-center text-sm text-gray-600">
        <p>© 2026 AMMS — AI Meeting Memory System · Built with MERN Stack</p>
      </footer>
    </div>
  )
}

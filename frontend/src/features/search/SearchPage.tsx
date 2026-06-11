import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Sparkles, FileText, Mic, CheckSquare, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/http/client'
import type { SearchResult } from '@/types'

const SUGGESTIONS = [
  'What decisions were made about the budget?',
  'Who is responsible for the API redesign?',
  'When is the product launch deadline?',
  'What were the key concerns raised?',
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const { data, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search', submitted],
    queryFn: () =>
      api.get('/semantic-search', { params: { q: submitted } }).then((r) => r.data.data),
    enabled: submitted.length > 2,
  })

  const handleSearch = (q: string) => {
    setQuery(q)
    setSubmitted(q)
  }

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'transcript') return <Mic size={14} className="text-blue-400" />
    if (type === 'summary')    return <FileText size={14} className="text-purple-400" />
    return <CheckSquare size={14} className="text-amber-400" />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-header">Smart Search</h1>
        <p className="text-gray-500 text-sm">Ask anything about your meetings in plain language.</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Sparkles size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) handleSearch(query.trim()) }}
          placeholder="Ask a question about your meetings…"
          className="input-field pl-12 pr-32 py-4 text-base"
        />
        <button
          onClick={() => query.trim() && handleSearch(query.trim())}
          disabled={!query.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary text-sm py-2 px-4"
        >
          {isLoading ? <span className="spinner" /> : <>Search <ArrowRight size={14} /></>}
        </button>
      </div>

      {/* Suggestions */}
      {!submitted && (
        <div>
          <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => handleSearch(s)}
                className="px-3 py-2 rounded-lg glass border border-white/10 text-xs text-gray-400
                           hover:text-white hover:border-brand-500/30 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {submitted && (
        <div>
          <p className="text-xs text-gray-600 mb-4">
            {isLoading ? 'Searching…' : `${data?.length ?? 0} results for "${submitted}"`}
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 skeleton rounded-2xl" />
              ))}
            </div>
          ) : !data?.length ? (
            <div className="text-center py-16">
              <Search size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">No results found</p>
              <p className="text-gray-600 text-sm mt-1">Try different keywords or check if meetings are transcribed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((r, i) => (
                <motion.div
                  key={`${r.meetingId}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link to={`/meetings/${r.meetingId}`}
                      className="text-sm font-medium text-white hover:text-brand-300 transition-colors">
                      {r.meetingTitle}
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {typeIcon(r.type)}
                      <span className="text-xs text-gray-500 capitalize">{r.type}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: r.snippet.replace(
                        new RegExp(submitted, 'gi'),
                        (m) => `<mark class="bg-brand-500/20 text-brand-300 rounded px-0.5">${m}</mark>`
                      )
                    }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600">
                      {format(new Date(r.date), 'MMM d, yyyy')}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.round(r.score * 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{Math.round(r.score * 100)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

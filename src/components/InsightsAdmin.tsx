'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type InsightItem = {
  company: string
  summary: string
  highlights: string[]
  jobIds?: number[]
}

export default function InsightsAdmin() {
  const [weekYear, setWeekYear] = useState<number>(new Date().getFullYear())
  const [weekNumber, setWeekNumber] = useState<number>(1)
  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [slug, setSlug] = useState('')
  const [tags, setTags] = useState<string>('')
  const [hero, setHero] = useState('')
  const [featured, setFeatured] = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [items, setItems] = useState<InsightItem[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [existing, setExisting] = useState<Array<{ week_year: number; week_number: number; title: string; published_at: string | null }>>([])
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [showJobModal, setShowJobModal] = useState(false)
  const [jobModalIndex, setJobModalIndex] = useState<number | null>(null)
  const [companyQuery, setCompanyQuery] = useState('')
  const [titleQuery, setTitleQuery] = useState('')
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([])
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [suggestedJobs, setSuggestedJobs] = useState<any[]>([])
  const debounceTimer = useRef<number | null>(null)

  const addItem = () => setItems(prev => [...prev, { company: '', summary: '', highlights: [], jobIds: [] }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const updateItem = (idx: number, patch: Partial<InsightItem>) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const updateHighlight = (idx: number, hi: number, value: string) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, highlights: it.highlights.map((h, j) => (j === hi ? value : h)) } : it)))

  const addHighlight = (idx: number) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, highlights: [...it.highlights, ''] } : it)))

  const removeHighlight = (idx: number, hi: number) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, highlights: it.highlights.filter((_, j) => j !== hi) } : it)))

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const payload = {
        week_year: weekYear,
        week_number: weekNumber,
        title,
        intro,
        slug: slug || undefined,
        tags: tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        hero_image_url: hero || undefined,
        is_featured: featured,
        published_at: publishNow ? new Date().toISOString() : null,
        items: items.map(it => ({
          company: it.company,
          summary: it.summary,
          highlights: it.highlights,
          job_ids: it.jobIds && it.jobIds.length ? it.jobIds : undefined,
        })),
      }
      const res = await fetch('/api/admin/insights/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Kunne ikke gemme indsigt')
      const data = await res.json()
      setMsg(`Gemt (id=${data.id})`)
      await refreshExisting()
    } catch (e: any) {
      setMsg(e.message || 'Fejl')
    } finally {
      setBusy(false)
    }
  }

  // Admin job search helper: fetch and append selected job titles as highlights
  const searchJobs = async (term: string) => {
    const url = `/api/admin/jobs/search?q=${encodeURIComponent(term)}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.jobs as Array<{ id: number; title: string; company: string; location: string }>
  }

  const openJobModalFor = (idx: number) => { setJobModalIndex(idx); setShowJobModal(true) }

  // Native completion for company and title
  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current)
    debounceTimer.current = window.setTimeout(async () => {
      if (!companyQuery && !titleQuery) {
        setCompanySuggestions([])
        setTitleSuggestions([])
        setSuggestedJobs([])
        return
      }
      const url = `/api/admin/jobs/suggest?company=${encodeURIComponent(companyQuery)}&title=${encodeURIComponent(titleQuery)}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      setCompanySuggestions(data.companies || [])
      setTitleSuggestions(data.titles || [])
      setSuggestedJobs(data.jobs || [])
    }, 250)
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current)
    }
  }, [companyQuery, titleQuery])

  // Load list of existing insights for quick selection
  useEffect(() => {
    refreshExisting()
  }, [])

  const refreshExisting = async () => {
    const res = await fetch('/api/admin/insights/list')
    if (!res.ok) return
    const data = await res.json()
    const rows = (data.insights || []).map((r: any) => ({
      week_year: r.week_year,
      week_number: r.week_number,
      title: r.title,
      published_at: r.published_at,
    }))
    setExisting(rows)
  }

  const loadExisting = async (y?: number, w?: number) => {
    const yy = y ?? weekYear
    const ww = w ?? weekNumber
    if (!yy || !ww) return
    const res = await fetch(`/api/admin/insights/get?year=${yy}&week=${ww}`)
    if (!res.ok) { setMsg('Kunne ikke hente indsigt'); return }
    const data = await res.json()
    const insight = data.insight
    if (!insight) { setMsg('Ingen publiceret indsigt for ugen'); return }
    setTitle(insight.title || '')
    setIntro(insight.intro || '')
    setItems((insight.items || []).map((it: any) => ({
      company: it.company || '',
      summary: it.summary || '',
      highlights: Array.isArray(it.highlights) ? it.highlights : [],
      jobIds: Array.isArray(it.job_ids) ? it.job_ids : [],
    })))
    setPublishNow(!!insight.published_at)
    setMsg('Indlæst')
  }

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
      <h3 className="text-lg font-medium text-white">Ugentlige indsigter</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="input" type="number" value={weekYear} onChange={e => setWeekYear(parseInt(e.target.value || '0'))} placeholder="År" />
        <input className="input" type="number" value={weekNumber} onChange={e => setWeekNumber(parseInt(e.target.value || '0'))} placeholder="Uge" />
        <input className="input md:col-span-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel" />
      </div>

      {/* Fjernet top-listen; tabel flyttes helt nederst */}
      <textarea className="input w-full" value={intro} onChange={e => setIntro(e.target.value)} placeholder="Intro" rows={3} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (valgfri)" />
        <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (kommasepareret)" />
        <input className="input" value={hero} onChange={e => setHero(e.target.value)} placeholder="Hero image URL (valgfri)" />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={publishNow} onChange={e => setPublishNow(e.target.checked)} />
        Publicer nu
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
        Fremhæv (featured)
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">Observationer</h4>
          <button onClick={addItem} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg">Tilføj</button>
        </div>
        {/* Native completion inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <input className="input w-full" value={companyQuery} onChange={e => setCompanyQuery(e.target.value)} placeholder="Søg virksomhed (completion)" />
            {companySuggestions.length > 0 && (
              <div className="mt-1 text-xs text-slate-300">
                Forslag: {companySuggestions.slice(0, 5).join(' • ')}
              </div>
            )}
          </div>
          <div className="md:col-span-1">
            <input className="input w-full" value={titleQuery} onChange={e => setTitleQuery(e.target.value)} placeholder="Søg jobtitel (completion)" />
            {titleSuggestions.length > 0 && (
              <div className="mt-1 text-xs text-slate-300">
                Forslag: {titleSuggestions.slice(0, 5).join(' • ')}
              </div>
            )}
          </div>
          <div className="md:col-span-1">
            {suggestedJobs.length > 0 && (
              <div className="text-xs text-slate-300">
                {suggestedJobs.slice(0, 5).map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="truncate">{j.title || 'Uden titel'}{j.company ? `, ${j.company}` : ''}</span>
                    <button
                      className="px-2 py-0.5 bg-slate-700 rounded"
                      onClick={() => setItems(prev => prev.length === 0 ? [{ company: j.company || '', summary: '', highlights: [`${j.title || 'Uden titel'}${j.company ? `, ${j.company}` : ''}`] }] : prev.map((it, i) => (i === prev.length - 1 ? { ...it, highlights: [...it.highlights, `${j.title || 'Uden titel'}${j.company ? `, ${j.company}` : ''}`] } : it)))}
                    >Tilføj</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {items.map((it, idx) => (
          <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input" value={it.company} onChange={e => updateItem(idx, { company: e.target.value })} placeholder="Virksomhed" />
              <input className="input md:col-span-2" value={it.summary} onChange={e => updateItem(idx, { summary: e.target.value })} placeholder="Opsummering" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Highlights</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => addHighlight(idx)} className="px-2 py-1 bg-slate-700 rounded">+ Manuelt</button>
                  <button onClick={() => openJobModalFor(idx)} className="px-2 py-1 bg-slate-700 rounded">+ Fra job</button>
                </div>
              </div>
              {it.highlights.map((h, hi) => (
                <div key={hi} className="flex items-center gap-2">
                  <input className="input flex-1" value={h} onChange={e => updateHighlight(idx, hi, e.target.value)} placeholder={`Punkt ${hi+1}`} />
                  <button onClick={() => removeHighlight(idx, hi)} className="px-2 py-1 bg-slate-700 rounded">−</button>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={() => removeItem(idx)} className="px-3 py-1.5 bg-slate-700 rounded-lg">Fjern</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button disabled={busy} onClick={submit} className="px-4 py-2 bg-kpmg-500 hover:bg-kpmg-700 disabled:bg-gray-600 text-white rounded-lg">Gem</button>
        {msg && <span className="text-sm text-slate-300">{msg}</span>}
      </div>

      {/* Tidligere indsigter tabel (helt nederst) */}
      <div className="mt-6">
        <h4 className="text-white font-medium mb-2">Tidligere indsigter</h4>
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">Uge</th>
                <th className="text-left px-3 py-2">År</th>
                <th className="text-left px-3 py-2">Titel</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {existing.map((r) => {
                const key = `${r.week_year}-${r.week_number}`
                const isSelected = selectedKey === key
                return (
                  <tr key={key} className={isSelected ? 'bg-white/5' : ''}>
                    <td className="px-3 py-2 text-slate-200">{r.week_number}</td>
                    <td className="px-3 py-2 text-slate-200">{r.week_year}</td>
                    <td className="px-3 py-2 text-slate-300 truncate">{r.title || ''}</td>
                    <td className="px-3 py-2">
                      <span className={r.published_at ? 'text-green-300' : 'text-yellow-300'}>
                        {r.published_at ? 'Publiceret' : 'Kladde'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="px-2 py-1 bg-slate-700 rounded"
                        onClick={() => { setWeekYear(r.week_year); setWeekNumber(r.week_number); setSelectedKey(key); loadExisting(r.week_year, r.week_number) }}
                      >Rediger</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; border-radius: 0.5rem; padding: 0.5rem 0.75rem; }
      `}</style>

      {showJobModal && (
        <JobSearchModal
          onClose={() => setShowJobModal(false)}
          onSelectMultiple={(jobs) => {
            if (jobModalIndex === null) return
            setItems(prev => prev.map((it, i) => {
              if (i !== jobModalIndex) return it
              const existingLines = new Set(it.highlights)
              const existingIds = new Set(it.jobIds || [])
              const newHighlights: string[] = [...it.highlights]
              const newIds: number[] = [...(it.jobIds || [])]
              for (const j of jobs) {
                if (!existingIds.has(j.id)) {
                  existingIds.add(j.id)
                  newIds.push(j.id)
                }
                const line = `${j.title || 'Uden titel'}${j.company ? `, ${j.company}` : ''}`
                if (!existingLines.has(line)) {
                  existingLines.add(line)
                  newHighlights.push(line)
                }
              }
              return { ...it, highlights: newHighlights, jobIds: newIds }
            }))
            setShowJobModal(false)
          }}
        />
      )}
    </div>
  )
}

function JobSearchModal({ onClose, onSelectMultiple }: { onClose: () => void; onSelectMultiple: (jobs: Array<{id: number; title: string; company?: string}>) => void }) {
  const [company, setCompany] = useState('')
  const [title, setTitle] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!company && !title) { setResults([]); return }
      setLoading(true)
      const url = `/api/admin/jobs/suggest?company=${encodeURIComponent(company)}&title=${encodeURIComponent(title)}`
      const res = await fetch(url)
      const data = await res.json()
      setResults(data.jobs || [])
      setLoading(false)
    }, 250)
    return () => clearTimeout(handler)
  }, [company, title])

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">Søg job</h4>
          <button className="px-2 py-1 bg-slate-700 rounded" onClick={onClose}>Luk</button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input className="input" placeholder="Virksomhed" value={company} onChange={e => setCompany(e.target.value)} />
          <input className="input" placeholder="Jobtitel" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="max-h-80 overflow-auto space-y-1">
          {loading && <div className="text-slate-400 text-sm">Søger…</div>}
          {!loading && results.map((j: any) => (
            <label key={j.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-2">
                <input type="checkbox" />
                <div className="text-sm text-slate-200 truncate">{j.title || 'Uden titel'}{j.company ? `, ${j.company}` : ''}</div>
              </div>
              <span className="text-xs text-slate-400">#{j.id}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            className="px-3 py-1.5 bg-indigo-600 rounded text-white text-sm"
            onClick={() => {
              const chosen = results // In a real impl, filter selected checkboxes
              onSelectMultiple(chosen.map((r: any) => ({ id: r.id, title: r.title, company: r.company })))
            }}
          >Tilføj valgte</button>
        </div>
      </div>
    </div>
  )
}


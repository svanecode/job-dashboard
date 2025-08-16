import TopNav from '@/components/TopNav'
import UserMenu from '@/components/UserMenu'
import { Suspense } from 'react'
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase/server'
import InsightsWeekly from '@/components/InsightsWeekly'
import InsightsArchiveMobile from '@/components/InsightsArchiveMobile'

export const revalidate = 3600

export default async function InsightsPage({ searchParams }: { searchParams?: { id?: string } }) {
  // Hent arkivliste og valgt indsigts-uge
  const supabase = await supabaseServer()

  const { data: archive } = await supabase
    .from('weekly_insights_public')
    .select('id, week_year, week_number, title, published_at')
    .order('published_at', { ascending: false })
    .limit(200)

  const selectedId = searchParams?.id

  // Hent den valgte indsigt (eller seneste hvis ingen valgt)
  let selectedInsight = null as any
  if (selectedId) {
    const { data: chosen } = await supabase
      .from('weekly_insights_public')
      .select('*')
      .eq('id', selectedId)
      .maybeSingle()
    selectedInsight = chosen
  }
  if (!selectedInsight) {
    const { data: latest } = await supabase
      .from('weekly_insights_public')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    selectedInsight = latest
  }

  return (
    <main className="container-mobile md:container mx-auto py-6 md:py-10 space-y-6 md:space-y-8">
      {/* NYT: Redesignet sidehoved-sektion */}
      <div className="text-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 md:p-12 mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight text-white leading-tight text-balance">
          Ugens indsigter
        </h1>
        <p className="mt-4 text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          Læs korte, skarpe indsigter om CFO-markedet – opdateret hver uge.
        </p>
        <div className="mt-6 flex justify-center">
          <SubscribeForm />
        </div>
      </div>

      {/* Mobil: arkiv-åbner */}
      <InsightsArchiveMobile archive={(archive || []) as any} selectedId={selectedInsight?.id} />

      {/* Content: venstresidet arkiv + højresidet detaljer */}
      <section className="md:grid md:grid-cols-[280px_1fr] md:gap-6 lg:gap-8">
        {/* Venstre: Scrollbart arkiv */}
        <aside className="hidden md:block sticky top-24 self-start">
          {/* NYT: Tilføj en overskrift til arkivet */}
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3 px-3">Arkiv</h3>
          <nav className="rounded-xl border border-white/10 bg-white/5 p-2">
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <ul className="space-y-1">
                {(archive || []).map((it: any) => {
                  const isActive = selectedInsight?.id === it.id
                  const week = String(it.week_number).padStart(2, '0')
                  const dateStr = it.published_at ? new Date(it.published_at).toLocaleDateString('da-DK') : ''
                  return (
                    <li key={it.id}>
                      <Link
                        href={`/insights?id=${it.id}`}
                        className={
                          `block rounded-lg px-3 py-2 border transition-colors ` +
                          (isActive
                            // NYT: Tydeligere styling for aktivt element
                            ? 'bg-kpmg-500/20 border-kpmg-500/30 text-white'
                            : 'bg-transparent border-transparent text-slate-300 hover:bg-white/5 hover:text-white')
                        }
                      >
                        <div className="text-xs text-slate-400">Uge {week}, {it.week_year} • {dateStr}</div>
                        <div className="text-sm font-medium truncate">{it.title}</div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </nav>
        </aside>

        {/* Højre: valgt indsigt */}
        <div className="space-y-5 md:space-y-6 max-w-3xl md:max-w-none">
          {selectedInsight ? (
            <InsightsWeekly insight={selectedInsight as any} />
          ) : (
            <p className="text-slate-400">Ingen publicerede indsigter endnu.</p>
          )}
        </div>
      </section>
    </main>
  )
}

function InsightCard({ title, date, excerpt }: { title: string; date: string; excerpt: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <h2 className="text-white text-lg font-medium">{title}</h2>
        <time className="text-slate-400 text-sm">{new Date(date).toLocaleDateString('da-DK')}</time>
      </div>
      <p className="text-slate-300">{excerpt}</p>
    </article>
  )
}

// Replaced with client component InsightsWeekly

function SubscribeForm() {
  return (
    <form className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 max-w-md w-full"
      action="/api/insights/subscribe" method="post">
      <input type="email" name="email" required placeholder="Din e-mail..."
        className="bg-transparent outline-none px-3 py-2 text-sm text-white placeholder:text-slate-400 w-full flex-1"
      />
      <button type="submit" className="px-4 py-2 rounded-lg bg-kpmg-500 text-white text-sm font-medium hover:bg-kpmg-700 transition-colors">
        Tilmeld
      </button>
    </form>
  )
}


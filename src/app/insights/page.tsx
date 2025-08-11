import TopNav from '@/components/TopNav'
import UserMenu from '@/components/UserMenu'
import { Suspense } from 'react'
import { supabaseServer } from '@/lib/supabase/server'
import InsightsWeekly from '@/components/InsightsWeekly'

export const revalidate = 3600

export default async function InsightsPage() {
  // Try fetching latest published weekly insight via the view
  const supabase = await supabaseServer()
  const { data } = await supabase
    .from('weekly_insights_public')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <main className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-white mb-1">Ugens indsigter</h1>
          <p className="text-slate-400">Læse korte, skarpe indsigter om CFO-markedet – opdateret hver uge.</p>
        </div>
        <UserMenu />
      </div>

      <div className="flex items-center justify-between">
        <Suspense>
          <TopNav />
        </Suspense>
        <SubscribeForm />
      </div>

      <section className="space-y-4">
        {data ? (
          <InsightsWeekly insight={data as any} />
        ) : (
          <p className="text-slate-400">Ingen publicerede indsigter endnu.</p>
        )}
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
    <form
      className="flex items-center gap-2"
      action="/api/insights/subscribe"
      method="post"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="Din e-mail"
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
      <button
        type="submit"
        className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
      >
        Tilmeld
      </button>
    </form>
  )
}


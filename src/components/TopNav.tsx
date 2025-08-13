'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

export default function TopNav() {
  const pathname = usePathname()

  const makeLinkClass = (href: string) =>
    clsx(
      'px-3 py-1.5 rounded-lg text-sm transition-colors',
      pathname === href
        ? 'bg-white/10 text-white'
        : 'text-slate-300 hover:text-white hover:bg-white/10'
    )

  return (
    <nav className="flex items-center gap-2">
      <Link href="/" className={makeLinkClass('/')}>Dashboard</Link>
      <Link href="/insights" className={makeLinkClass('/insights')}>Indsigter</Link>
      <Link href="/chat" className={makeLinkClass('/chat')}>Chat</Link>
    </nav>
  )
}


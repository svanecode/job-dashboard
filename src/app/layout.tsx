import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import TopNav from '@/components/TopNav'
import UserMenu from '@/components/UserMenu'
import MiniChat from '@/components/MiniChat'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KPMG CFO Dashboard',
  description: 'Dashboard til at finde virksomheder der har behov for CFO Interim Assistance',
}

function CursorFX() {
  if (typeof window === 'undefined') return null as any
  if (!document.querySelector('#cursor-dot')) {
    const dot = document.createElement('div')
    dot.id = 'cursor-dot'
    dot.className = 'cursor-dot'
    const ring = document.createElement('div')
    ring.id = 'cursor-ring'
    ring.className = 'cursor-ring'
    document.body.append(dot, ring)

    const move = (e: MouseEvent) => {
      const x = e.clientX, y = e.clientY
      dot.style.transform = `translate(${x - 3}px,${y - 3}px)`
      ring.style.transform = `translate(${x - 14}px,${y - 14}px)`
    }
    window.addEventListener('mousemove', move)

    const setActive = (on: boolean) => ring.classList.toggle('cursor-ring--active', on)
    document.addEventListener('mouseover', (e) => {
      const t = e.target as HTMLElement
      setActive(!!t.closest('button,a,[role="button"],.chip,.cursor-pointer'))
    })
    document.addEventListener('mouseout', () => setActive(false))
  }
  return null as any
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-body bg-ink text-slate-200 antialiased">
        <AuthProvider>
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <TopNav />
              <UserMenu />
            </div>
            {children}
          </div>
          {/* Global mini chat - ensure it stays below UserMenu z-index */}
          <MiniChat />
        </AuthProvider>
        {CursorFX()}
      </body>
    </html>
  )
}

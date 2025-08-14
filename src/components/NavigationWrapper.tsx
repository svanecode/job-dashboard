'use client'

import { useAuth } from '@/contexts/AuthContext'
import TopNav from './TopNav'
import UserMenu from './UserMenu'

export default function NavigationWrapper() {
  const { user, loading, initialized } = useAuth()

  // Don't show navigation while loading or if user is not authenticated
  if (loading || !initialized || !user) {
    return null
  }

  return (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <TopNav />
      <UserMenu />
    </div>
  )
} 